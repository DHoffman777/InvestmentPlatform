"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegulatoryFilingService = void 0;
const events_1 = require("events");
const ioredis_1 = __importDefault(require("ioredis"));
class RegulatoryFilingService extends events_1.EventEmitter {
    config;
    redis;
    constructor(config) {
        super();
        this.config = config;
        this.redis = new ioredis_1.default({
            host: config.database.redis.host,
            port: config.database.redis.port,
            password: config.database.redis.password,
            db: config.database.redis.db,
            keyPrefix: 'filing-service:',
        });
        this.setupFilingScheduler();
    }
    async createFilingRequirement(firmId, requirement) {
        const filingRequirement = {
            ...requirement,
            id: this.generateFilingId(),
            amendments: [],
        };
        // Store filing requirement
        await this.redis.setex(`filing:${filingRequirement.id}`, 86400 * 365 * 7, // 7 years retention
        JSON.stringify(filingRequirement));
        // Index by firm, form type, and due date
        await this.redis.sadd(`firm-filings:${firmId}`, filingRequirement.id);
        await this.redis.sadd(`form-filings:${requirement.formType}`, filingRequirement.id);
        const dueDateStr = requirement.dueDate.toISOString().split('T')[0];
        await this.redis.sadd(`due-filings:${dueDateStr}`, filingRequirement.id);
        // Schedule reminders
        await this.scheduleFilingReminders(filingRequirement);
        this.emit('filingRequirementCreated', {
            filingId: filingRequirement.id,
            firmId,
            formType: requirement.formType,
            dueDate: requirement.dueDate,
            frequency: requirement.frequency,
        });
        console.log(`Filing requirement created: ${filingRequirement.id} (${requirement.formType})`);
        return filingRequirement;
    }
    async prepareFormADV(firmId, filingPeriod) {
        const firm = await this.getFirmData(firmId);
        const formData = await this.generateFormADVData(firm, filingPeriod);
        const validationResults = await this.validateFormADV(formData);
        const filing = await this.createFilingRequirement(firmId, {
            formType: 'ADV',
            frequency: 'ANNUAL',
            dueDate: this.calculateFormADVDueDate(),
            filingPeriod,
            status: 'IN_PROGRESS',
            assignedTo: firm.complianceOfficer.id,
            estimatedHours: 40,
            dependencies: [],
            regulatoryAuthority: 'SEC',
            submissionMethod: 'IARD',
        });
        // Store form data
        await this.redis.setex(`form-data:${filing.id}`, 86400 * 180, // 6 months
        JSON.stringify(formData));
        // Store validation results
        await this.redis.setex(`validation:${filing.id}`, 86400 * 180, JSON.stringify(validationResults));
        const readyToFile = validationResults.errors.length === 0;
        this.emit('formADVPrepared', {
            filingId: filing.id,
            firmId,
            validationPassed: readyToFile,
            errorCount: validationResults.errors.length,
            warningCount: validationResults.warnings.length,
        });
        return {
            filingId: filing.id,
            formData,
            validationResults,
            readyToFile,
        };
    }
    async prepareFormPF(firmId, filingPeriod) {
        const firm = await this.getFirmData(firmId);
        const formData = await this.generateFormPFData(firm, filingPeriod);
        const validationResults = await this.validateFormPF(formData);
        const filing = await this.createFilingRequirement(firmId, {
            formType: 'PF',
            frequency: firm.assetsUnderManagement >= 150000000 ? 'QUARTERLY' : 'ANNUAL',
            dueDate: this.calculateFormPFDueDate(firm.assetsUnderManagement),
            filingPeriod,
            status: 'IN_PROGRESS',
            assignedTo: firm.complianceOfficer.id,
            estimatedHours: 60,
            dependencies: [],
            regulatoryAuthority: 'SEC',
            submissionMethod: 'IARD',
        });
        await this.redis.setex(`form-data:${filing.id}`, 86400 * 180, JSON.stringify(formData));
        await this.redis.setex(`validation:${filing.id}`, 86400 * 180, JSON.stringify(validationResults));
        const readyToFile = validationResults.errors.length === 0;
        this.emit('formPFPrepared', {
            filingId: filing.id,
            firmId,
            validationPassed: readyToFile,
            errorCount: validationResults.errors.length,
            warningCount: validationResults.warnings.length,
        });
        return {
            filingId: filing.id,
            formData,
            validationResults,
            readyToFile,
        };
    }
    async prepare13FHoldings(firmId, reportingPeriod) {
        const holdingsData = await this.generateForm13FData(firmId, reportingPeriod);
        const validationResults = await this.validateForm13F(holdingsData);
        const filing = await this.createFilingRequirement(firmId, {
            formType: '13F',
            frequency: 'QUARTERLY',
            dueDate: this.calculateForm13FDueDate(),
            filingPeriod: reportingPeriod,
            status: 'IN_PROGRESS',
            estimatedHours: 20,
            dependencies: [],
            regulatoryAuthority: 'SEC',
            submissionMethod: 'EDGAR',
        });
        await this.redis.setex(`form-data:${filing.id}`, 86400 * 180, JSON.stringify(holdingsData));
        await this.redis.setex(`validation:${filing.id}`, 86400 * 180, JSON.stringify(validationResults));
        const readyToFile = validationResults.errors.length === 0;
        this.emit('form13FPrepared', {
            filingId: filing.id,
            firmId,
            validationPassed: readyToFile,
            holdingsCount: holdingsData.holdings?.length || 0,
            totalValue: holdingsData.totalValue || 0,
        });
        return {
            filingId: filing.id,
            holdingsData,
            validationResults,
            readyToFile,
        };
    }
    async submitFiling(filingId, submittedBy) {
        const filing = await this.getFilingRequirement(filingId);
        if (!filing) {
            throw new Error('Filing requirement not found');
        }
        const formData = await this.getFormData(filingId);
        const validationResults = await this.getValidationResults(filingId);
        if (validationResults.errors.length > 0) {
            return {
                success: false,
                errors: validationResults.errors,
            };
        }
        let submissionResult;
        try {
            switch (filing.submissionMethod) {
                case 'IARD':
                    submissionResult = await this.submitToIARD(filing, formData);
                    break;
                case 'EDGAR':
                    submissionResult = await this.submitToEDGAR(filing, formData);
                    break;
                case 'CRD':
                    submissionResult = await this.submitToCRD(filing, formData);
                    break;
                case 'FINRA_GATEWAY':
                    submissionResult = await this.submitToFINRAGateway(filing, formData);
                    break;
                default:
                    throw new Error(`Unsupported submission method: ${filing.submissionMethod}`);
            }
            // Update filing status
            filing.status = 'FILED';
            filing.actualHours = this.calculateActualHours(filing);
            await this.redis.setex(`filing:${filingId}`, 86400 * 365 * 7, JSON.stringify(filing));
            // Record submission
            await this.recordSubmission(filingId, submittedBy, submissionResult);
            this.emit('filingSubmitted', {
                filingId,
                formType: filing.formType,
                submittedBy,
                confirmationNumber: submissionResult.confirmationNumber,
                submissionMethod: filing.submissionMethod,
            });
            return {
                success: true,
                confirmationNumber: submissionResult.confirmationNumber,
            };
        }
        catch (error) {
            filing.status = 'REVIEW';
            await this.redis.setex(`filing:${filingId}`, 86400 * 365 * 7, JSON.stringify(filing));
            this.emit('filingSubmissionFailed', {
                filingId,
                formType: filing.formType,
                error: error.message,
            });
            return {
                success: false,
                errors: [error.message],
            };
        }
    }
    async fileAmendment(originalFilingId, amendmentReason, amendmentData, filedBy) {
        const originalFiling = await this.getFilingRequirement(originalFilingId);
        if (!originalFiling) {
            throw new Error('Original filing not found');
        }
        const amendment = {
            id: this.generateAmendmentId(),
            amendmentNumber: originalFiling.amendments.length + 1,
            reason: amendmentReason,
            filedDate: new Date(),
            description: `Amendment ${originalFiling.amendments.length + 1} to ${originalFiling.formType}`,
            affectedSections: this.identifyAffectedSections(amendmentData),
        };
        // Validate amendment
        const validationResults = await this.validateAmendment(originalFiling, amendmentData);
        if (validationResults.errors.length > 0) {
            throw new Error(`Amendment validation failed: ${validationResults.errors.join(', ')}`);
        }
        // Submit amendment
        const submissionResult = await this.submitAmendment(originalFiling, amendmentData, amendment);
        // Update original filing
        originalFiling.amendments.push(amendment);
        await this.redis.setex(`filing:${originalFilingId}`, 86400 * 365 * 7, JSON.stringify(originalFiling));
        // Store amendment data
        await this.redis.setex(`amendment:${amendment.id}`, 86400 * 365 * 7, JSON.stringify({
            ...amendment,
            originalFilingId,
            amendmentData,
            submissionResult,
            filedBy,
        }));
        this.emit('amendmentFiled', {
            amendmentId: amendment.id,
            originalFilingId,
            amendmentNumber: amendment.amendmentNumber,
            reason: amendmentReason,
            filedBy,
        });
        console.log(`Amendment filed: ${amendment.id} for filing ${originalFilingId}`);
        return amendment;
    }
    async getFilingStatus(filingId) {
        const filing = await this.getFilingRequirement(filingId);
        if (!filing) {
            throw new Error('Filing not found');
        }
        const progress = this.calculateFilingProgress(filing);
        const timeRemaining = this.calculateTimeRemaining(filing.dueDate);
        const blockers = await this.identifyBlockers(filing);
        const nextSteps = this.generateNextSteps(filing, blockers);
        return {
            filing,
            progress,
            timeRemaining,
            blockers,
            nextSteps,
        };
    }
    async getFilingCalendar(firmId, startDate, endDate) {
        const filings = await this.getFirmFilings(firmId, startDate, endDate);
        const deadlines = this.groupFilingsByDeadline(filings);
        const workload = this.calculateWeeklyWorkload(filings);
        return {
            filings,
            deadlines,
            workload,
        };
    }
    setupFilingScheduler() {
        // Check for filing deadlines every hour
        setInterval(() => {
            this.checkFilingDeadlines();
        }, 60 * 60 * 1000);
        // Generate periodic filings daily at midnight
        setInterval(() => {
            this.generatePeriodicFilings();
        }, 24 * 60 * 60 * 1000);
    }
    async checkFilingDeadlines() {
        const today = new Date();
        const upcoming = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        // Check for filings due in the next 7 days
        const pattern = 'filing:*';
        const keys = await this.redis.keys(pattern);
        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                const filing = JSON.parse(data);
                if (filing.dueDate >= today && filing.dueDate <= upcoming && filing.status !== 'FILED') {
                    this.emit('filingDeadlineApproaching', {
                        filingId: filing.id,
                        formType: filing.formType,
                        dueDate: filing.dueDate,
                        daysRemaining: Math.ceil((filing.dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
                        status: filing.status,
                    });
                }
            }
        }
    }
    async generatePeriodicFilings() {
        // Generate new filing requirements based on firm registrations and frequencies
        console.log('Generating periodic filing requirements');
    }
    async scheduleFilingReminders(filing) {
        // Schedule reminders at 30, 14, 7, and 1 days before due date
        const reminderDays = [30, 14, 7, 1];
        const now = Date.now();
        for (const days of reminderDays) {
            const reminderTime = filing.dueDate.getTime() - (days * 24 * 60 * 60 * 1000);
            if (reminderTime > now) {
                setTimeout(() => {
                    this.emit('filingReminder', {
                        filingId: filing.id,
                        formType: filing.formType,
                        daysUntilDue: days,
                        dueDate: filing.dueDate,
                        status: filing.status,
                    });
                }, reminderTime - now);
            }
        }
    }
    // Helper methods for form generation and validation
    async generateFormADVData(firm, filingPeriod) {
        return {
            firmInfo: {
                name: firm.name,
                crd: firm.crd,
                iard: firm.iard,
                businessType: firm.type,
            },
            businessActivities: firm.businessActivities,
            clientTypes: firm.clientTypes,
            assetsUnderManagement: firm.assetsUnderManagement,
            custody: firm.custody,
            compliance: firm.complianceOfficer,
            // Additional Form ADV specific fields would be added here
        };
    }
    async validateFormADV(formData) {
        const errors = [];
        const warnings = [];
        // Validation logic for Form ADV
        if (!formData.firmInfo?.name)
            errors.push('Firm name is required');
        if (!formData.firmInfo?.crd)
            errors.push('CRD number is required');
        if (!formData.assetsUnderManagement)
            errors.push('Assets under management is required');
        return { errors, warnings };
    }
    async generateFormPFData(firm, filingPeriod) {
        return {
            firmInfo: {
                name: firm.name,
                iard: firm.iard,
            },
            reportingPeriod: filingPeriod,
            // Form PF specific data
        };
    }
    async validateFormPF(formData) {
        const errors = [];
        const warnings = [];
        // Form PF validation logic
        return { errors, warnings };
    }
    async generateForm13FData(firmId, reportingPeriod) {
        // Generate 13F holdings data
        return {
            reportingPeriod,
            holdings: [],
            totalValue: 0,
        };
    }
    async validateForm13F(holdingsData) {
        const errors = [];
        const warnings = [];
        // 13F validation logic
        return { errors, warnings };
    }
    // Submission methods
    async submitToIARD(filing, formData) {
        // IARD submission implementation
        return { confirmationNumber: `IARD_${Date.now()}` };
    }
    async submitToEDGAR(filing, formData) {
        // EDGAR submission implementation
        return { confirmationNumber: `EDGAR_${Date.now()}` };
    }
    async submitToCRD(filing, formData) {
        // CRD submission implementation
        return { confirmationNumber: `CRD_${Date.now()}` };
    }
    async submitToFINRAGateway(filing, formData) {
        // FINRA Gateway submission implementation
        return { confirmationNumber: `FINRA_${Date.now()}` };
    }
    // Utility methods
    generateFilingId() {
        return `filing_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    generateAmendmentId() {
        return `amend_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    calculateFormADVDueDate() {
        // Form ADV is due within 90 days of fiscal year end
        const fiscalYearEnd = new Date(new Date().getFullYear(), 11, 31); // December 31
        return new Date(fiscalYearEnd.getTime() + 90 * 24 * 60 * 60 * 1000);
    }
    calculateFormPFDueDate(aum) {
        // Form PF deadlines vary based on AUM
        const days = aum >= 5000000000 ? 60 : 120; // $5B threshold
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
    calculateForm13FDueDate() {
        // 13F is due 45 days after quarter end
        const now = new Date();
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return new Date(quarterEnd.getTime() + 45 * 24 * 60 * 60 * 1000);
    }
    async getFirmData(firmId) {
        // Get firm data from database
        throw new Error('Not implemented');
    }
    async getFilingRequirement(filingId) {
        const data = await this.redis.get(`filing:${filingId}`);
        return data ? JSON.parse(data) : null;
    }
    async getFormData(filingId) {
        const data = await this.redis.get(`form-data:${filingId}`);
        return data ? JSON.parse(data) : null;
    }
    async getValidationResults(filingId) {
        const data = await this.redis.get(`validation:${filingId}`);
        return data ? JSON.parse(data) : { errors: [], warnings: [] };
    }
    calculateActualHours(filing) {
        // Calculate based on creation time and completion time
        return filing.estimatedHours; // Simplified
    }
    async recordSubmission(filingId, submittedBy, result) {
        const submissionRecord = {
            filingId,
            submittedBy,
            submissionDate: new Date(),
            result,
        };
        await this.redis.setex(`submission:${filingId}`, 86400 * 365 * 7, JSON.stringify(submissionRecord));
    }
    identifyAffectedSections(amendmentData) {
        // Identify which sections of the form are affected by the amendment
        return Object.keys(amendmentData);
    }
    async validateAmendment(original, amendmentData) {
        // Validate amendment data
        return { errors: [], warnings: [] };
    }
    async submitAmendment(original, amendmentData, amendment) {
        // Submit amendment based on the submission method
        return { confirmationNumber: `AMEND_${Date.now()}` };
    }
    calculateFilingProgress(filing) {
        // Calculate progress based on status and completion
        const statusProgress = {
            'NOT_STARTED': 0,
            'IN_PROGRESS': 50,
            'REVIEW': 80,
            'FILED': 100,
            'LATE': 100,
            'AMENDED': 100,
        };
        return statusProgress[filing.status] || 0;
    }
    calculateTimeRemaining(dueDate) {
        const now = new Date();
        const diff = dueDate.getTime() - now.getTime();
        const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
        if (days < 0)
            return `${Math.abs(days)} days overdue`;
        if (days === 0)
            return 'Due today';
        if (days === 1)
            return '1 day remaining';
        return `${days} days remaining`;
    }
    async identifyBlockers(filing) {
        const blockers = [];
        // Check for dependencies
        for (const dep of filing.dependencies) {
            const dependency = await this.getFilingRequirement(dep);
            if (!dependency || dependency.status !== 'FILED') {
                blockers.push(`Waiting for ${dependency?.formType || dep} to be filed`);
            }
        }
        // Check for validation errors
        const validation = await this.getValidationResults(filing.id);
        if (validation.errors.length > 0) {
            blockers.push(`${validation.errors.length} validation errors need to be resolved`);
        }
        return blockers;
    }
    generateNextSteps(filing, blockers) {
        const steps = [];
        if (blockers.length > 0) {
            steps.push('Resolve blocking issues');
        }
        switch (filing.status) {
            case 'NOT_STARTED':
                steps.push('Begin data collection and form preparation');
                break;
            case 'IN_PROGRESS':
                steps.push('Complete form sections and validate data');
                break;
            case 'REVIEW':
                steps.push('Review form for accuracy and submit');
                break;
        }
        return steps;
    }
    async getFirmFilings(firmId, startDate, endDate) {
        const filingIds = await this.redis.smembers(`firm-filings:${firmId}`);
        const filings = [];
        for (const filingId of filingIds) {
            const filing = await this.getFilingRequirement(filingId);
            if (filing && filing.dueDate >= startDate && filing.dueDate <= endDate) {
                filings.push(filing);
            }
        }
        return filings.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    }
    groupFilingsByDeadline(filings) {
        const grouped = new Map();
        for (const filing of filings) {
            const dateKey = filing.dueDate.toISOString().split('T')[0];
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, []);
            }
            grouped.get(dateKey).push(filing);
        }
        return Array.from(grouped.entries()).map(([dateStr, filings]) => ({
            date: new Date(dateStr),
            filings,
        }));
    }
    calculateWeeklyWorkload(filings) {
        const workload = new Map();
        for (const filing of filings) {
            const week = this.getWeekString(filing.dueDate);
            const currentHours = workload.get(week) || 0;
            workload.set(week, currentHours + filing.estimatedHours);
        }
        return Array.from(workload.entries()).map(([week, hours]) => ({
            week,
            estimatedHours: hours,
        }));
    }
    getWeekString(date) {
        const year = date.getFullYear();
        const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
        return `${year}-W${week.toString().padStart(2, '0')}`;
    }
    async cleanup() {
        await this.redis.quit();
    }
}
exports.RegulatoryFilingService = RegulatoryFilingService;

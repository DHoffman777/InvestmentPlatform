import { EventEmitter } from 'events';
import Redis from 'ioredis';
import axios from 'axios';
import crypto from 'crypto';
import {
  FilingRequirement,
  FilingAmendment,
  FinancialServicesFirm,
  FinancialServicesConfig,
  RegulatoryRegistration,
} from '../types';

export class RegulatoryFilingService extends EventEmitter {
  private redis: Redis;

  constructor(private config: FinancialServicesConfig) {
    super();
    
    this.redis = new Redis({
      host: config.database.redis.host,
      port: config.database.redis.port,
      password: config.database.redis.password,
      db: config.database.redis.db,
      keyPrefix: 'filing-service:',
    });

    this.setupFilingScheduler();
  }

  public async createFilingRequirement(
    firmId: string,
    requirement: Omit<FilingRequirement, 'id' | 'amendments'>
  ): Promise<FilingRequirement> {
    const filingRequirement: FilingRequirement = {
      ...requirement,
      id: this.generateFilingId(),
      amendments: [],
    };

    // Store filing requirement
    await this.redis.setex(
      `filing:${filingRequirement.id}`,
      86400 * 365 * 7, // 7 years retention
      JSON.stringify(filingRequirement)
    );

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

  public async prepareFormADV(firmId: string, filingPeriod: string): Promise<{
    filingId: string;
    formData: any;
    validationResults: any;
    readyToFile: boolean;
  }> {
    const firm = await this.getFirmData(firmId);
    const formData = await this.generateFormADVData(firm, filingPeriod);
    const validationResults = await this.validateFormADV(formData);

    const filing: FilingRequirement = await this.createFilingRequirement(firmId, {
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
    await this.redis.setex(
      `form-data:${filing.id}`,
      86400 * 180, // 6 months
      JSON.stringify(formData)
    );

    // Store validation results
    await this.redis.setex(
      `validation:${filing.id}`,
      86400 * 180,
      JSON.stringify(validationResults)
    );

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

  public async prepareFormPF(firmId: string, filingPeriod: string): Promise<{
    filingId: string;
    formData: any;
    validationResults: any;
    readyToFile: boolean;
  }> {
    const firm = await this.getFirmData(firmId);
    const formData = await this.generateFormPFData(firm, filingPeriod);
    const validationResults = await this.validateFormPF(formData);

    const filing: FilingRequirement = await this.createFilingRequirement(firmId, {
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

  public async prepare13FHoldings(firmId: string, reportingPeriod: string): Promise<{
    filingId: string;
    holdingsData: any;
    validationResults: any;
    readyToFile: boolean;
  }> {
    const holdingsData = await this.generateForm13FData(firmId, reportingPeriod);
    const validationResults = await this.validateForm13F(holdingsData);

    const filing: FilingRequirement = await this.createFilingRequirement(firmId, {
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

  public async submitFiling(filingId: string, submittedBy: string): Promise<{
    success: boolean;
    confirmationNumber?: string;
    errors?: string[];
  }> {
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

      await this.redis.setex(
        `filing:${filingId}`,
        86400 * 365 * 7,
        JSON.stringify(filing)
      );

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

    } catch (error: any) {
      filing.status = 'REVIEW';
      await this.redis.setex(`filing:${filingId}`, 86400 * 365 * 7, JSON.stringify(filing));

      this.emit('filingSubmissionFailed', {
        filingId,
        formType: filing.formType,
        error: (error as Error).message,
      });

      return {
        success: false,
        errors: [(error as Error).message],
      };
    }
  }

  public async fileAmendment(
    originalFilingId: string,
    amendmentReason: string,
    amendmentData: any,
    filedBy: string
  ): Promise<FilingAmendment> {
    const originalFiling = await this.getFilingRequirement(originalFilingId);
    if (!originalFiling) {
      throw new Error('Original filing not found');
    }

    const amendment: FilingAmendment = {
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
    await this.redis.setex(
      `filing:${originalFilingId}`,
      86400 * 365 * 7,
      JSON.stringify(originalFiling)
    );

    // Store amendment data
    await this.redis.setex(
      `amendment:${amendment.id}`,
      86400 * 365 * 7,
      JSON.stringify({
        ...amendment,
        originalFilingId,
        amendmentData,
        submissionResult,
        filedBy,
      })
    );

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

  public async getFilingStatus(filingId: string): Promise<{
    filing: FilingRequirement;
    progress: number;
    timeRemaining: string;
    blockers: string[];
    nextSteps: string[];
  }> {
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

  public async getFilingCalendar(
    firmId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    filings: FilingRequirement[];
    deadlines: { date: Date; filings: FilingRequirement[] }[];
    workload: { week: string; estimatedHours: number }[];
  }> {
    const filings = await this.getFirmFilings(firmId, startDate, endDate);
    const deadlines = this.groupFilingsByDeadline(filings);
    const workload = this.calculateWeeklyWorkload(filings);

    return {
      filings,
      deadlines,
      workload,
    };
  }

  private setupFilingScheduler(): void {
    // Check for filing deadlines every hour
    setInterval(() => {
      this.checkFilingDeadlines();
    }, 60 * 60 * 1000);

    // Generate periodic filings daily at midnight
    setInterval(() => {
      this.generatePeriodicFilings();
    }, 24 * 60 * 60 * 1000);
  }

  private async checkFilingDeadlines(): Promise<any> {
    const today = new Date();
    const upcoming = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Check for filings due in the next 7 days
    const pattern = 'filing:*';
    const keys = await this.redis.keys(pattern);

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const filing: FilingRequirement = JSON.parse(data);
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

  private async generatePeriodicFilings(): Promise<any> {
    // Generate new filing requirements based on firm registrations and frequencies
    console.log('Generating periodic filing requirements');
  }

  private async scheduleFilingReminders(filing: FilingRequirement): Promise<any> {
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
  private async generateFormADVData(firm: FinancialServicesFirm, filingPeriod: string): Promise<any> {
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

  private async validateFormADV(formData: any): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation logic for Form ADV
    if (!formData.firmInfo?.name) errors.push('Firm name is required');
    if (!formData.firmInfo?.crd) errors.push('CRD number is required');
    if (!formData.assetsUnderManagement) errors.push('Assets under management is required');

    return { errors, warnings };
  }

  private async generateFormPFData(firm: FinancialServicesFirm, filingPeriod: string): Promise<any> {
    return {
      firmInfo: {
        name: firm.name,
        iard: firm.iard,
      },
      reportingPeriod: filingPeriod,
      // Form PF specific data
    };
  }

  private async validateFormPF(formData: any): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Form PF validation logic
    return { errors, warnings };
  }

  private async generateForm13FData(firmId: string, reportingPeriod: string): Promise<any> {
    // Generate 13F holdings data
    return {
      reportingPeriod,
      holdings: [],
      totalValue: 0,
    };
  }

  private async validateForm13F(holdingsData: any): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 13F validation logic
    return { errors, warnings };
  }

  // Submission methods
  private async submitToIARD(filing: FilingRequirement, formData: any): Promise<any> {
    // IARD submission implementation
    return { confirmationNumber: `IARD_${Date.now()}` };
  }

  private async submitToEDGAR(filing: FilingRequirement, formData: any): Promise<any> {
    // EDGAR submission implementation
    return { confirmationNumber: `EDGAR_${Date.now()}` };
  }

  private async submitToCRD(filing: FilingRequirement, formData: any): Promise<any> {
    // CRD submission implementation
    return { confirmationNumber: `CRD_${Date.now()}` };
  }

  private async submitToFINRAGateway(filing: FilingRequirement, formData: any): Promise<any> {
    // FINRA Gateway submission implementation
    return { confirmationNumber: `FINRA_${Date.now()}` };
  }

  // Utility methods
  private generateFilingId(): string {
    return `filing_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateAmendmentId(): string {
    return `amend_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private calculateFormADVDueDate(): Date {
    // Form ADV is due within 90 days of fiscal year end
    const fiscalYearEnd = new Date(new Date().getFullYear(), 11, 31); // December 31
    return new Date(fiscalYearEnd.getTime() + 90 * 24 * 60 * 60 * 1000);
  }

  private calculateFormPFDueDate(aum: number): Date {
    // Form PF deadlines vary based on AUM
    const days = aum >= 5000000000 ? 60 : 120; // $5B threshold
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private calculateForm13FDueDate(): Date {
    // 13F is due 45 days after quarter end
    const now = new Date();
    const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    return new Date(quarterEnd.getTime() + 45 * 24 * 60 * 60 * 1000);
  }

  private async getFirmData(firmId: string): Promise<FinancialServicesFirm> {
    // Get firm data from database
    throw new Error('Not implemented');
  }

  private async getFilingRequirement(filingId: string): Promise<FilingRequirement | null> {
    const data = await this.redis.get(`filing:${filingId}`);
    return data ? JSON.parse(data) : null;
  }

  private async getFormData(filingId: string): Promise<any> {
    const data = await this.redis.get(`form-data:${filingId}`);
    return data ? JSON.parse(data) : null;
  }

  private async getValidationResults(filingId: string): Promise<any> {
    const data = await this.redis.get(`validation:${filingId}`);
    return data ? JSON.parse(data) : { errors: [], warnings: [] };
  }

  private calculateActualHours(filing: FilingRequirement): number {
    // Calculate based on creation time and completion time
    return filing.estimatedHours; // Simplified
  }

  private async recordSubmission(filingId: string, submittedBy: string, result: any): Promise<any> {
    const submissionRecord = {
      filingId,
      submittedBy,
      submissionDate: new Date(),
      result,
    };

    await this.redis.setex(
      `submission:${filingId}`,
      86400 * 365 * 7,
      JSON.stringify(submissionRecord)
    );
  }

  private identifyAffectedSections(amendmentData: any): string[] {
    // Identify which sections of the form are affected by the amendment
    return Object.keys(amendmentData);
  }

  private async validateAmendment(original: FilingRequirement, amendmentData: any): Promise<{ errors: string[]; warnings: string[] }> {
    // Validate amendment data
    return { errors: [], warnings: [] };
  }

  private async submitAmendment(original: FilingRequirement, amendmentData: any, amendment: FilingAmendment): Promise<any> {
    // Submit amendment based on the submission method
    return { confirmationNumber: `AMEND_${Date.now()}` };
  }

  private calculateFilingProgress(filing: FilingRequirement): number {
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

  private calculateTimeRemaining(dueDate: Date): string {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  }

  private async identifyBlockers(filing: FilingRequirement): Promise<string[]> {
    const blockers: string[] = [];
    
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

  private generateNextSteps(filing: FilingRequirement, blockers: string[]): string[] {
    const steps: string[] = [];

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

  private async getFirmFilings(firmId: string, startDate: Date, endDate: Date): Promise<FilingRequirement[]> {
    const filingIds = await this.redis.smembers(`firm-filings:${firmId}`);
    const filings: FilingRequirement[] = [];

    for (const filingId of filingIds) {
      const filing = await this.getFilingRequirement(filingId);
      if (filing && filing.dueDate >= startDate && filing.dueDate <= endDate) {
        filings.push(filing);
      }
    }

    return filings.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  private groupFilingsByDeadline(filings: FilingRequirement[]): { date: Date; filings: FilingRequirement[] }[] {
    const grouped = new Map<string, FilingRequirement[]>();

    for (const filing of filings) {
      const dateKey = filing.dueDate.toISOString().split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(filing);
    }

    return Array.from(grouped.entries()).map(([dateStr, filings]) => ({
      date: new Date(dateStr),
      filings,
    }));
  }

  private calculateWeeklyWorkload(filings: FilingRequirement[]): { week: string; estimatedHours: number }[] {
    const workload = new Map<string, number>();

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

  private getWeekString(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  public async cleanup(): Promise<any> {
    await this.redis.quit();
  }
}


import { EventEmitter } from 'events';
import { FilingRequirement, FilingAmendment, FinancialServicesConfig } from '../types';
export declare class RegulatoryFilingService extends EventEmitter {
    private config;
    private redis;
    constructor(config: FinancialServicesConfig);
    createFilingRequirement(firmId: string, requirement: Omit<FilingRequirement, 'id' | 'amendments'>): Promise<FilingRequirement>;
    prepareFormADV(firmId: string, filingPeriod: string): Promise<{
        filingId: string;
        formData: any;
        validationResults: any;
        readyToFile: boolean;
    }>;
    prepareFormPF(firmId: string, filingPeriod: string): Promise<{
        filingId: string;
        formData: any;
        validationResults: any;
        readyToFile: boolean;
    }>;
    prepare13FHoldings(firmId: string, reportingPeriod: string): Promise<{
        filingId: string;
        holdingsData: any;
        validationResults: any;
        readyToFile: boolean;
    }>;
    submitFiling(filingId: string, submittedBy: string): Promise<{
        success: boolean;
        confirmationNumber?: string;
        errors?: string[];
    }>;
    fileAmendment(originalFilingId: string, amendmentReason: string, amendmentData: any, filedBy: string): Promise<FilingAmendment>;
    getFilingStatus(filingId: string): Promise<{
        filing: FilingRequirement;
        progress: number;
        timeRemaining: string;
        blockers: string[];
        nextSteps: string[];
    }>;
    getFilingCalendar(firmId: string, startDate: Date, endDate: Date): Promise<{
        filings: FilingRequirement[];
        deadlines: {
            date: Date;
            filings: FilingRequirement[];
        }[];
        workload: {
            week: string;
            estimatedHours: number;
        }[];
    }>;
    private setupFilingScheduler;
    private checkFilingDeadlines;
    private generatePeriodicFilings;
    private scheduleFilingReminders;
    private generateFormADVData;
    private validateFormADV;
    private generateFormPFData;
    private validateFormPF;
    private generateForm13FData;
    private validateForm13F;
    private submitToIARD;
    private submitToEDGAR;
    private submitToCRD;
    private submitToFINRAGateway;
    private generateFilingId;
    private generateAmendmentId;
    private calculateFormADVDueDate;
    private calculateFormPFDueDate;
    private calculateForm13FDueDate;
    private getFirmData;
    private getFilingRequirement;
    private getFormData;
    private getValidationResults;
    private calculateActualHours;
    private recordSubmission;
    private identifyAffectedSections;
    private validateAmendment;
    private submitAmendment;
    private calculateFilingProgress;
    private calculateTimeRemaining;
    private identifyBlockers;
    private generateNextSteps;
    private getFirmFilings;
    private groupFilingsByDeadline;
    private calculateWeeklyWorkload;
    private getWeekString;
    cleanup(): Promise<any>;
}

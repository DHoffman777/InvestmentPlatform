import { FormPF, RegulatoryFiling } from '../../models/regulatory/Regulatory';
interface FormPFPreparationData {
    tenantId: string;
    fundName: string;
    fundId: string;
    filingType: 'annual' | 'quarterly';
    reportingPeriodEnd: Date;
    fundInformation: any;
    advisorInformation: any;
    investmentStrategy: any;
    performanceData: any;
    riskMetrics: any;
}
interface FormPFValidationResult {
    isValid: boolean;
    errors: Array<{
        section: string;
        field: string;
        message: string;
        severity: 'error' | 'warning';
    }>;
    warnings: Array<{
        section: string;
        field: string;
        message: string;
    }>;
    completionPercentage: number;
    thresholdAnalysis: {
        requiresSection4: boolean;
        isLargePrivateFund: boolean;
        reportingThresholdMet: boolean;
    };
}
interface FormPFFilingOptions {
    testFiling: boolean;
    expeditedProcessing: boolean;
    confirmationRequired: boolean;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        description: string;
    }>;
}
export declare class FormPFService {
    private eventPublisher;
    private forms;
    private filings;
    private readonly SECTION_4_THRESHOLD;
    private readonly LARGE_PRIVATE_FUND_THRESHOLD;
    constructor();
    prepareFormPF(data: FormPFPreparationData): Promise<FormPF>;
    validateFormPF(formId: string): Promise<FormPFValidationResult>;
    submitFormPF(formId: string, submittedBy: string, filingOptions?: FormPFFilingOptions): Promise<RegulatoryFiling>;
    getFormPF(formId: string): Promise<FormPF | null>;
    getFormPFsByTenant(tenantId: string): Promise<FormPF[]>;
    updateFormPF(formId: string, updates: Partial<FormPF>): Promise<FormPF>;
    calculateFilingRequirements(tenantId: string, funds: Array<{
        fundId: string;
        fundName: string;
        netAssetValue: number;
        fundType: string;
    }>): Promise<{
        requiresFilingByFund: Array<{
            fundId: string;
            fundName: string;
            requiresFiling: boolean;
            filingFrequency: 'annual' | 'quarterly' | 'none';
            requiresSection4: boolean;
            nextFilingDue: Date;
        }>;
        aggregateRequirements: {
            totalFundsRequiringFiling: number;
            totalAnnualFilings: number;
            totalQuarterlyFilings: number;
            nextFilingDue: Date;
        };
    }>;
    generateFormPFReport(formId: string): Promise<{
        summary: any;
        complianceStatus: any;
        riskAnalysis: any;
        filingHistory: any[];
    }>;
    private submitToSEC;
    private calculateDueDate;
    private getNextQuarterEnd;
    private calculateVolatility;
    private getFileType;
}
export {};

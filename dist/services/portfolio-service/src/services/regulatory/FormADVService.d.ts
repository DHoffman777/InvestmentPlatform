import { FormADV, RegulatoryFiling } from '../../models/regulatory/Regulatory';
interface FormADVPreparationData {
    tenantId: string;
    firmName: string;
    crdNumber: string;
    filingType: 'initial' | 'annual' | 'amendment' | 'other_than_annual';
    reportingPeriodEnd: Date;
    businessInformation: any;
    ownershipStructure: any;
    advisoryBusiness: any;
    clientBase: any;
    assetsUnderManagement: number;
}
interface FormADVValidationResult {
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
}
interface FormADVFilingOptions {
    testFiling: boolean;
    expeditedProcessing: boolean;
    confirmationRequired: boolean;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        description: string;
    }>;
}
export declare class FormADVService {
    private eventPublisher;
    private forms;
    private filings;
    constructor();
    prepareFormADV(data: FormADVPreparationData): Promise<FormADV>;
    validateFormADV(formId: string): Promise<FormADVValidationResult>;
    submitFormADV(formId: string, submittedBy: string, filingOptions?: FormADVFilingOptions): Promise<RegulatoryFiling>;
    getFormADV(formId: string): Promise<FormADV | null>;
    getFormADVsByTenant(tenantId: string): Promise<FormADV[]>;
    updateFormADV(formId: string, updates: Partial<FormADV>): Promise<FormADV>;
    amendFormADV(originalFormId: string, amendmentData: Partial<FormADV>, amendmentReason: string, submittedBy: string): Promise<FormADV>;
    generateFormADVReport(formId: string): Promise<{
        summary: any;
        complianceStatus: any;
        filingHistory: any[];
    }>;
    private submitToSEC;
    private calculateDueDate;
    private getFileType;
}
export {};

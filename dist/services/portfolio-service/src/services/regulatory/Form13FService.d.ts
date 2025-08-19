import { Form13F, RegulatoryFiling } from '../../models/regulatory/Regulatory';
interface Form13FPreparationData {
    tenantId: string;
    managerName: string;
    managerCIK: string;
    reportingPeriodEnd: Date;
    isAmendment?: boolean;
    amendmentNumber?: number;
    holdings: Array<{
        nameOfIssuer: string;
        titleOfClass: string;
        cusip: string;
        marketValue: number;
        sharesOrPrincipalAmount: {
            sharesNumber?: number;
            principalAmount?: number;
            sharesOrPrincipal: 'SH' | 'PRN';
        };
        investmentDiscretion: 'SOLE' | 'SHARED' | 'NONE';
        otherManager?: string;
        votingAuthority: {
            sole: number;
            shared: number;
            none: number;
        };
    }>;
    otherManagers?: Array<{
        managerName: string;
        managerCIK: string;
        formTypeCode: string;
    }>;
    confidentialTreatmentRequests?: Array<{
        nameOfIssuer: string;
        titleOfClass: string;
        reasonForConfidentiality: string;
    }>;
}
interface Form13FValidationResult {
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
    summary: {
        totalHoldings: number;
        totalValue: number;
        reportingThresholdMet: boolean;
        duplicateHoldings: number;
        missingCUSIPs: number;
    };
    completionPercentage: number;
}
interface Form13FFilingOptions {
    testFiling: boolean;
    expeditedProcessing: boolean;
    confirmationRequired: boolean;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        description: string;
    }>;
}
interface HoldingAnalysis {
    cusip: string;
    issuerName: string;
    titleOfClass: string;
    totalValue: number;
    totalShares: number;
    managersReporting: number;
    concentrationRisk: number;
    votingPower: {
        soleVoting: number;
        sharedVoting: number;
        noVoting: number;
    };
}
export declare class Form13FService {
    private eventPublisher;
    private forms;
    private filings;
    private readonly REPORTING_THRESHOLD;
    constructor();
    prepareForm13F(data: Form13FPreparationData): Promise<Form13F>;
    validateForm13F(formId: string): Promise<Form13FValidationResult>;
    submitForm13F(formId: string, submittedBy: string, filingOptions?: Form13FFilingOptions): Promise<RegulatoryFiling>;
    getForm13F(formId: string): Promise<Form13F | null>;
    getForm13FsByTenant(tenantId: string): Promise<Form13F[]>;
    updateForm13F(formId: string, updates: Partial<Form13F>): Promise<Form13F>;
    analyzeHoldings(formId: string): Promise<{
        topHoldings: HoldingAnalysis[];
        sectorConcentration: Array<{
            sector: string;
            value: number;
            percentage: number;
            holdingsCount: number;
        }>;
        concentrationRisk: {
            top5Concentration: number;
            top10Concentration: number;
            herfindahlIndex: number;
        };
        votingAnalysis: {
            totalSoleVotingPower: number;
            totalSharedVotingPower: number;
            totalNoVotingPower: number;
        };
    }>;
    generateForm13FReport(formId: string): Promise<{
        summary: any;
        complianceStatus: any;
        holdingsAnalysis: any;
        filingHistory: any[];
    }>;
    private submitToSEC;
    private calculateDueDate;
    private getFileType;
}
export {};

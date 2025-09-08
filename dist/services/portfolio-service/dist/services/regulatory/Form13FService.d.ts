export const __esModule: boolean;
export class Form13FService {
    eventPublisher: eventPublisher_1.EventPublisher;
    forms: Map<any, any>;
    filings: Map<any, any>;
    REPORTING_THRESHOLD: number;
    prepareForm13F(data: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        managerName: any;
        managerCIK: any;
        reportingPeriodEnd: any;
        filingDate: Date;
        amendmentNumber: any;
        isAmendment: any;
        coverPage: {
            managerName: any;
            formTypeCode: string;
            tableEntryTotal: any;
            tableValueTotal: number;
            isConfidentialOmitted: boolean;
            providesAdditionalInfo: boolean;
        };
        summary: {
            otherIncludedManagers: any;
            totalValuePortfolio: number;
            totalNumberOfHoldings: any;
        };
        holdings: any;
        confidentialInformation: any;
        status: Regulatory_1.FilingStatus;
        submittedBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    validateForm13F(formId: any): Promise<{
        isValid: boolean;
        errors: {
            section: string;
            field: string;
            message: string;
            severity: string;
        }[];
        warnings: {
            section: string;
            field: string;
            message: string;
        }[];
        summary: {
            totalHoldings: any;
            totalValue: number;
            reportingThresholdMet: boolean;
            duplicateHoldings: number;
            missingCUSIPs: number;
        };
        completionPercentage: number;
    }>;
    submitForm13F(formId: any, submittedBy: any, filingOptions?: {
        testFiling: boolean;
        expeditedProcessing: boolean;
        confirmationRequired: boolean;
    }): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        formType: Regulatory_1.FormType;
        jurisdiction: Regulatory_1.RegulatoryJurisdiction;
        filingDate: Date;
        reportingPeriodEnd: any;
        dueDate: Date;
        formData: any;
        status: Regulatory_1.FilingStatus;
        workflowStage: string;
        reviewers: any[];
        amendmentNumber: any;
        attachments: any;
        complianceChecks: any[];
        auditTrail: {
            action: string;
            performedBy: any;
            performedAt: Date;
            details: {
                testFiling: boolean;
                holdingsCount: any;
                totalValue: number;
                isAmendment: any;
            };
        }[];
        createdBy: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getForm13F(formId: any): Promise<any>;
    getForm13FsByTenant(tenantId: any): Promise<any[]>;
    updateForm13F(formId: any, updates: any): Promise<any>;
    analyzeHoldings(formId: any): Promise<{
        topHoldings: any;
        sectorConcentration: {
            sector: string;
            value: number;
            percentage: number;
            holdingsCount: number;
        }[];
        concentrationRisk: {
            top5Concentration: number;
            top10Concentration: number;
            herfindahlIndex: any;
        };
        votingAnalysis: {
            totalSoleVotingPower: any;
            totalSharedVotingPower: any;
            totalNoVotingPower: any;
        };
    }>;
    generateForm13FReport(formId: any): Promise<{
        summary: {
            formId: any;
            managerName: any;
            managerCIK: any;
            reportingPeriodEnd: any;
            status: any;
            totalHoldings: any;
            totalValue: number;
            isAmendment: any;
            amendmentNumber: any;
            createdAt: any;
            lastUpdated: any;
        };
        complianceStatus: {
            isValid: boolean;
            completionPercentage: number;
            errorCount: number;
            warningCount: number;
            reportingThresholdMet: boolean;
            duplicateHoldings: number;
            missingCUSIPs: number;
        };
        holdingsAnalysis: {
            topHoldings: any;
            sectorConcentration: {
                sector: string;
                value: number;
                percentage: number;
                holdingsCount: number;
            }[];
            concentrationRisk: {
                top5Concentration: number;
                top10Concentration: number;
                herfindahlIndex: any;
            };
            votingAnalysis: {
                totalSoleVotingPower: any;
                totalSharedVotingPower: any;
                totalNoVotingPower: any;
            };
        };
        filingHistory: {
            filingId: any;
            filingDate: any;
            status: any;
            confirmationNumber: any;
            amendmentNumber: any;
        }[];
    }>;
    submitToSEC(form: any, options: any): Promise<{
        success: boolean;
        confirmationNumber: string;
        submissionId: `${string}-${string}-${string}-${string}-${string}`;
        processingTime: number;
        errors?: undefined;
    } | {
        success: boolean;
        errors: string[];
        processingTime: number;
        confirmationNumber?: undefined;
        submissionId?: undefined;
    }>;
    calculateDueDate(reportingPeriodEnd: any): Date;
    getFileType(filename: any): "application/pdf" | "application/octet-stream" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "application/xml" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "application/vnd.ms-excel";
}
import eventPublisher_1 = require("../../utils/eventPublisher");
import Regulatory_1 = require("../../models/regulatory/Regulatory");

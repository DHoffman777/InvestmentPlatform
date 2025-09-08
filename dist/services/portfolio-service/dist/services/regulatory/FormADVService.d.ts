export const __esModule: boolean;
export class FormADVService {
    eventPublisher: eventPublisher_1.EventPublisher;
    forms: Map<any, any>;
    filings: Map<any, any>;
    prepareFormADV(data: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        firmName: any;
        crdNumber: any;
        filingType: any;
        filingDate: Date;
        reportingPeriodEnd: any;
        part1A: {
            businessAddress: any;
            principalBusinessAddress: any;
            executiveOfficers: any;
            registrationStatus: {
                secRegistered: boolean;
                stateRegistered: boolean;
                exemptReportingAdviser: boolean;
            };
            businessActivities: {
                investmentAdviser: boolean;
                investmentCompany: boolean;
                brokerDealer: boolean;
                other: any[];
            };
        };
        part1B: {
            ownersAndExecutives: any;
            directOwners: any;
            indirectOwners: any;
        };
        part2A: {
            advisoryBusiness: {
                businessDescription: any;
                principalOwners: any;
                yearsInBusiness: any;
                typesOfClientsAdvised: any;
                assetsUnderManagement: any;
                discretionaryAUM: any;
                nonDiscretionaryAUM: any;
            };
            feesAndCompensation: {
                feeStructure: any;
                feeSchedule: any;
                otherCompensation: any;
            };
            performanceFees: {
                chargesPerformanceFees: any;
                performanceFeeStructure: any;
                clientTypes: any;
            };
            typesOfClients: {
                individuals: any;
                highNetWorthIndividuals: any;
                bankingInstitutions: any;
                investmentCompanies: any;
                businessDevelopmentCompanies: any;
                pensionPlans: any;
                charitableOrganizations: any;
                corporations: any;
                other: any;
            };
            methodsOfAnalysis: {
                charting: boolean;
                fundamental: boolean;
                technical: boolean;
                cyclical: boolean;
                quantitative: boolean;
                other: any[];
            };
            investmentStrategies: {
                longTerm: boolean;
                shortTerm: boolean;
                tradingStrategy: boolean;
                other: any[];
            };
            riskFactors: string[];
            disciplinaryInformation: {
                hasEvents: boolean;
                events: any[];
            };
        };
        status: Regulatory_1.FilingStatus;
        submittedBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    validateFormADV(formId: any): Promise<{
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
        completionPercentage: number;
    }>;
    submitFormADV(formId: any, submittedBy: any, filingOptions?: {
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
        attachments: any;
        complianceChecks: any[];
        auditTrail: {
            action: string;
            performedBy: any;
            performedAt: Date;
            details: {
                testFiling: boolean;
            };
        }[];
        createdBy: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getFormADV(formId: any): Promise<any>;
    getFormADVsByTenant(tenantId: any): Promise<any[]>;
    updateFormADV(formId: any, updates: any): Promise<any>;
    amendFormADV(originalFormId: any, amendmentData: any, amendmentReason: any, submittedBy: any): Promise<any>;
    generateFormADVReport(formId: any): Promise<{
        summary: {
            formId: any;
            firmName: any;
            crdNumber: any;
            filingType: any;
            status: any;
            assetsUnderManagement: any;
            reportingPeriodEnd: any;
            createdAt: any;
            lastUpdated: any;
        };
        complianceStatus: {
            isValid: boolean;
            completionPercentage: number;
            errorCount: number;
            warningCount: number;
            criticalIssues: number;
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
    calculateDueDate(filingType: any, reportingPeriodEnd: any): Date;
    getFileType(filename: any): "application/pdf" | "application/octet-stream" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "application/vnd.ms-excel";
}
import eventPublisher_1 = require("../../utils/eventPublisher");
import Regulatory_1 = require("../../models/regulatory/Regulatory");

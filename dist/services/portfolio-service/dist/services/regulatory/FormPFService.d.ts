export const __esModule: boolean;
export class FormPFService {
    eventPublisher: eventPublisher_1.EventPublisher;
    forms: Map<any, any>;
    filings: Map<any, any>;
    SECTION_4_THRESHOLD: number;
    LARGE_PRIVATE_FUND_THRESHOLD: number;
    prepareFormPF(data: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        fundName: any;
        fundId: any;
        filingType: any;
        reportingPeriodEnd: any;
        filingDate: Date;
        section1: {
            fundIdentifier: any;
            fundLegalName: any;
            fundPoolIdentifier: any;
            masterFundIdentifier: any;
            isFeederFund: any;
            isMasterFund: any;
            primaryBusinessAddress: any;
            mainBusinessAddress: any;
            fundType: any;
        };
        section2: {
            advisorCRDNumber: any;
            advisorSECNumber: any;
            reportingFundAUM: any;
            advisorTotalAUM: any;
            fundLaunchDate: any;
            fundFiscalYearEnd: any;
            fundDomicile: any;
            fundBaseCurrency: any;
        };
        section3: {
            investmentStrategy: {
                convertibleArbitrage: any;
                dedicatedShortBias: any;
                emergingMarkets: any;
                equityMarketNeutral: any;
                eventDriven: any;
                fixedIncomeArbitrage: any;
                globalMacro: any;
                longShortEquity: any;
                managedFutures: any;
                multiStrategy: any;
                fundOfFunds: any;
                other: any;
            };
            geographicFocus: {
                northAmerica: any;
                europe: any;
                asia: any;
                other: any;
            };
            borrowingAndLeverage: {
                grossAssetValue: any;
                netAssetValue: any;
                borrowings: any;
                derivativesNotional: any;
            };
            liquidityTerms: {
                redemptionFrequency: any;
                redemptionNotice: any;
                lockupPeriod: any;
                sideLetterTerms: any;
            };
        };
        status: Regulatory_1.FilingStatus;
        submittedBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    validateFormPF(formId: any): Promise<{
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
        thresholdAnalysis: {
            requiresSection4: boolean;
            isLargePrivateFund: boolean;
            reportingThresholdMet: boolean;
        };
    }>;
    submitFormPF(formId: any, submittedBy: any, filingOptions?: {
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
                requiresSection4: boolean;
                isLargePrivateFund: boolean;
            };
        }[];
        createdBy: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getFormPF(formId: any): Promise<any>;
    getFormPFsByTenant(tenantId: any): Promise<any[]>;
    updateFormPF(formId: any, updates: any): Promise<any>;
    calculateFilingRequirements(tenantId: any, funds: any): Promise<{
        requiresFilingByFund: any;
        aggregateRequirements: {
            totalFundsRequiringFiling: any;
            totalAnnualFilings: any;
            totalQuarterlyFilings: any;
            nextFilingDue: Date;
        };
    }>;
    generateFormPFReport(formId: any): Promise<{
        summary: {
            formId: any;
            fundName: any;
            fundId: any;
            filingType: any;
            status: any;
            reportingFundAUM: any;
            reportingPeriodEnd: any;
            createdAt: any;
            lastUpdated: any;
        };
        complianceStatus: {
            isValid: boolean;
            completionPercentage: number;
            errorCount: number;
            warningCount: number;
            thresholdAnalysis: {
                requiresSection4: boolean;
                isLargePrivateFund: boolean;
                reportingThresholdMet: boolean;
            };
        };
        riskAnalysis: {
            leverageRatio: number;
            concentrationRisk: any;
            liquidityProfile: any;
            counterpartyRisk: any;
            performanceVolatility: number;
        };
        filingHistory: {
            filingId: any;
            filingDate: any;
            status: any;
            confirmationNumber: any;
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
    getNextQuarterEnd(date: any): Date;
    calculateVolatility(returns: any): number;
    getFileType(filename: any): "application/pdf" | "application/octet-stream" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "application/vnd.ms-excel";
}
import eventPublisher_1 = require("../../utils/eventPublisher");
import Regulatory_1 = require("../../models/regulatory/Regulatory");

export const __esModule: boolean;
export class ClientRegulatoryReportsService {
    eventPublisher: eventPublisher_1.EventPublisher;
    reports: Map<any, any>;
    generateCRSReport(tenantId: any, clientId: any, clientName: any, reportData: any, reportingYear: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        clientId: any;
        clientName: any;
        reportType: string;
        jurisdiction: string;
        reportingPeriod: {
            startDate: Date;
            endDate: Date;
        };
        reportData: any;
        status: string;
        regulatoryRequirements: string[];
        confidentialityLevel: string;
        deliveryMethod: string;
        generatedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateFATCAReport(tenantId: any, clientId: any, clientName: any, reportData: any, reportingYear: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        clientId: any;
        clientName: any;
        reportType: string;
        jurisdiction: string;
        reportingPeriod: {
            startDate: Date;
            endDate: Date;
        };
        reportData: any;
        status: string;
        regulatoryRequirements: string[];
        confidentialityLevel: string;
        deliveryMethod: string;
        generatedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateQIBCertification(tenantId: any, clientId: any, clientName: any, certificationData: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        clientId: any;
        clientName: any;
        reportType: string;
        jurisdiction: string;
        reportingPeriod: {
            startDate: any;
            endDate: any;
        };
        reportData: any;
        status: string;
        regulatoryRequirements: string[];
        confidentialityLevel: string;
        deliveryMethod: string;
        generatedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateAMLSummary(tenantId: any, clientId: any, clientName: any, amlData: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        clientId: any;
        clientName: any;
        reportType: string;
        jurisdiction: string;
        reportingPeriod: {
            startDate: Date;
            endDate: Date;
        };
        reportData: any;
        status: string;
        regulatoryRequirements: string[];
        confidentialityLevel: string;
        deliveryMethod: string;
        generatedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateSuitabilityAssessment(tenantId: any, clientId: any, clientName: any, suitabilityData: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        clientId: any;
        clientName: any;
        reportType: string;
        jurisdiction: string;
        reportingPeriod: {
            startDate: any;
            endDate: any;
        };
        reportData: any;
        status: string;
        regulatoryRequirements: string[];
        confidentialityLevel: string;
        deliveryMethod: string;
        generatedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    validateClientReport(reportId: any): Promise<{
        isValid: boolean;
        errors: {
            field: string;
            message: string;
            severity: string;
        }[];
        warnings: any[];
        complianceChecks: any[];
    }>;
    deliverClientReport(reportId: any, deliveryOptions: any, deliveredBy: any): Promise<any>;
    approveClientReport(reportId: any, approvedBy: any): Promise<any>;
    getClientReport(reportId: any): Promise<any>;
    getClientReportsByClient(clientId: any): Promise<any[]>;
    getClientReportsByTenant(tenantId: any): Promise<any[]>;
    generateBulkClientReports(tenantId: any, reportType: any, clientIds: any, reportingPeriod: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        clientId: any;
        clientName: string;
        reportType: any;
        jurisdiction: string;
        reportingPeriod: any;
        reportData: {
            accountNumber: string;
            accountHolderInfo: {
                name: string;
                address: string;
                taxResidence: string[];
                tin: string[];
                dateOfBirth: Date;
                placeOfBirth: string;
            };
            accountBalance: number;
            income: {
                dividends: number;
                interest: number;
                capitalGains: number;
                other: number;
            };
            reportingYear: any;
        } | {
            accountNumber?: undefined;
            accountHolderInfo?: undefined;
            accountBalance?: undefined;
            income?: undefined;
            reportingYear?: undefined;
        };
        status: string;
        regulatoryRequirements: string[];
        confidentialityLevel: string;
        deliveryMethod: string;
        generatedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    validateCRSReport(data: any, errors: any, warnings: any, complianceChecks: any): void;
    validateFATCAReport(data: any, errors: any, warnings: any, complianceChecks: any): void;
    validateQIBCertification(data: any, errors: any, warnings: any, complianceChecks: any): void;
    validateAMLSummary(data: any, errors: any, warnings: any, complianceChecks: any): void;
    validateSuitabilityAssessment(data: any, errors: any, warnings: any, complianceChecks: any): void;
    processReportDelivery(report: any, deliveryOptions: any): Promise<void>;
    determineJurisdiction(taxResidence: any): "US" | "CA" | "AU" | "JP" | "EU" | "INTERNATIONAL" | "UK";
    generateMockReportData(reportType: any, clientId: any, reportingPeriod: any): {
        accountNumber: string;
        accountHolderInfo: {
            name: string;
            address: string;
            taxResidence: string[];
            tin: string[];
            dateOfBirth: Date;
            placeOfBirth: string;
        };
        accountBalance: number;
        income: {
            dividends: number;
            interest: number;
            capitalGains: number;
            other: number;
        };
        reportingYear: any;
    } | {
        accountNumber?: undefined;
        accountHolderInfo?: undefined;
        accountBalance?: undefined;
        income?: undefined;
        reportingYear?: undefined;
    };
    getRegulatoryRequirements(reportType: any): string[];
}
import eventPublisher_1 = require("../../utils/eventPublisher");

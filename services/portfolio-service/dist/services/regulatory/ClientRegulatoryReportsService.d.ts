interface ClientRegulatoryReport {
    id: string;
    tenantId: string;
    clientId: string;
    clientName: string;
    reportType: 'crs' | 'fatca' | 'qib_certification' | 'aml_summary' | 'suitability_assessment' | 'risk_disclosure' | 'fee_disclosure' | 'custom';
    jurisdiction: 'US' | 'EU' | 'UK' | 'CA' | 'AU' | 'JP' | 'INTERNATIONAL';
    reportingPeriod: {
        startDate: Date;
        endDate: Date;
    };
    reportData: any;
    status: 'draft' | 'review' | 'approved' | 'delivered' | 'archived';
    regulatoryRequirements: string[];
    confidentialityLevel: 'public' | 'confidential' | 'highly_confidential';
    deliveryMethod: 'email' | 'secure_portal' | 'physical_mail' | 'api';
    generatedAt: Date;
    deliveredAt?: Date;
    approvedBy?: string;
    approvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
interface CRSReport {
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
    reportingYear: number;
    reportingFI: {
        name: string;
        giin: string;
        address: string;
    };
}
interface FATCAReport {
    accountNumber: string;
    accountHolderInfo: {
        name: string;
        address: string;
        usPersonIndicators: string[];
        tin: string;
        dateOfBirth?: Date;
    };
    accountBalance: number;
    usSourceIncome: {
        dividends: number;
        interest: number;
        capitalGains: number;
        other: number;
    };
    reportingYear: number;
    withholdingApplied: number;
    pooledReporting: boolean;
}
interface QIBCertification {
    entityName: string;
    entityType: 'corporation' | 'partnership' | 'trust' | 'individual' | 'other';
    totalAssets: number;
    investmentExperience: string;
    qualificationBasis: string[];
    certificationDate: Date;
    expirationDate: Date;
    authorizedSignatory: {
        name: string;
        title: string;
        signature: string;
    };
}
interface AMLSummary {
    clientRiskRating: 'low' | 'medium' | 'high';
    customerDueDiligence: {
        identityVerified: boolean;
        sourceOfWealth: string;
        pep: boolean;
        sanctionsCheck: boolean;
        adverseMediaCheck: boolean;
    };
    transactionMonitoring: {
        unusualTransactions: number;
        sarsFiled: number;
        ctrsFiled: number;
    };
    ongoingMonitoring: {
        lastReview: Date;
        nextReviewDue: Date;
        reviewFrequency: 'monthly' | 'quarterly' | 'annually';
    };
}
interface SuitabilityAssessment {
    investmentObjectives: string[];
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    timeHorizon: string;
    liquidityNeeds: string;
    investmentExperience: string;
    financialSituation: {
        annualIncome: number;
        netWorth: number;
        investableAssets: number;
    };
    suitabilityScore: number;
    recommendedAllocations: Array<{
        assetClass: string;
        allocation: number;
        rationale: string;
    }>;
    lastAssessment: Date;
    nextAssessmentDue: Date;
}
interface ClientReportGenerationOptions {
    includeCharts: boolean;
    includeDetailedBreakdown: boolean;
    confidentialityWatermark: boolean;
    customBranding: boolean;
    outputFormat: 'pdf' | 'html' | 'json';
    deliveryOptions: {
        method: 'email' | 'secure_portal' | 'physical_mail' | 'api';
        encryptionRequired: boolean;
        passwordProtected: boolean;
        expirationDays?: number;
    };
}
interface ClientReportValidationResult {
    isValid: boolean;
    errors: Array<{
        field: string;
        message: string;
        severity: 'error' | 'warning';
    }>;
    warnings: Array<{
        field: string;
        message: string;
    }>;
    complianceChecks: Array<{
        requirement: string;
        status: 'met' | 'not_met' | 'partial';
        details: string;
    }>;
}
export declare class ClientRegulatoryReportsService {
    private eventPublisher;
    private reports;
    constructor();
    generateCRSReport(tenantId: string, clientId: string, clientName: string, reportData: CRSReport, reportingYear: number): Promise<ClientRegulatoryReport>;
    generateFATCAReport(tenantId: string, clientId: string, clientName: string, reportData: FATCAReport, reportingYear: number): Promise<ClientRegulatoryReport>;
    generateQIBCertification(tenantId: string, clientId: string, clientName: string, certificationData: QIBCertification): Promise<ClientRegulatoryReport>;
    generateAMLSummary(tenantId: string, clientId: string, clientName: string, amlData: AMLSummary): Promise<ClientRegulatoryReport>;
    generateSuitabilityAssessment(tenantId: string, clientId: string, clientName: string, suitabilityData: SuitabilityAssessment): Promise<ClientRegulatoryReport>;
    validateClientReport(reportId: string): Promise<ClientReportValidationResult>;
    deliverClientReport(reportId: string, deliveryOptions: ClientReportGenerationOptions['deliveryOptions'], deliveredBy: string): Promise<ClientRegulatoryReport>;
    approveClientReport(reportId: string, approvedBy: string): Promise<ClientRegulatoryReport>;
    getClientReport(reportId: string): Promise<ClientRegulatoryReport | null>;
    getClientReportsByClient(clientId: string): Promise<ClientRegulatoryReport[]>;
    getClientReportsByTenant(tenantId: string): Promise<ClientRegulatoryReport[]>;
    generateBulkClientReports(tenantId: string, reportType: ClientRegulatoryReport['reportType'], clientIds: string[], reportingPeriod: {
        startDate: Date;
        endDate: Date;
    }): Promise<ClientRegulatoryReport[]>;
    private validateCRSReport;
    private validateFATCAReport;
    private validateQIBCertification;
    private validateAMLSummary;
    private validateSuitabilityAssessment;
    private processReportDelivery;
    private determineJurisdiction;
    private generateMockReportData;
    private getRegulatoryRequirements;
}
export {};

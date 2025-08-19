export interface FinancialServicesFirm {
    id: string;
    name: string;
    type: 'BROKER_DEALER' | 'INVESTMENT_ADVISER' | 'DUAL_REGISTRANT' | 'BANK' | 'CREDIT_UNION' | 'INSURANCE_COMPANY';
    crd: string;
    iard: string;
    seic: string;
    registrations: RegulatoryRegistration[];
    licenses: BusinessLicense[];
    filingRequirements: FilingRequirement[];
    complianceOfficer: ComplianceOfficer;
    supervisoryStructure: SupervisoryStructure;
    businessActivities: BusinessActivity[];
    clientTypes: ClientType[];
    assetsUnderManagement: number;
    numberOfClients: number;
    custody: CustodyArrangement[];
    establishedDate: Date;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';
}
export interface RegulatoryRegistration {
    id: string;
    regulator: 'SEC' | 'FINRA' | 'CFTC' | 'MSRB' | 'SIPC' | 'STATE' | 'NFA' | 'FDIC' | 'OCC' | 'FED';
    registrationType: string;
    registrationNumber: string;
    effectiveDate: Date;
    expirationDate?: Date;
    status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'SUSPENDED' | 'WITHDRAWN';
    conditions: string[];
    exemptions: string[];
    lastRenewal?: Date;
    nextRenewal?: Date;
}
export interface BusinessLicense {
    id: string;
    licenseType: string;
    jurisdiction: string;
    licenseNumber: string;
    issuedDate: Date;
    expirationDate: Date;
    status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
    continuingEducationRequired: boolean;
    ceCreditsRequired?: number;
    ceCreditsCompleted?: number;
    ceDeadline?: Date;
}
export interface FilingRequirement {
    id: string;
    formType: 'ADV' | 'BD' | 'PF' | '13F' | 'FOCUS' | 'FORM_U4' | 'FORM_U5' | 'SAR' | 'CTR' | 'FORM_8K' | 'FORM_10K' | 'CUSTOM';
    frequency: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'AS_NEEDED' | 'EVENT_DRIVEN';
    dueDate: Date;
    filingPeriod: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'REVIEW' | 'FILED' | 'LATE' | 'AMENDED';
    assignedTo?: string;
    estimatedHours: number;
    actualHours?: number;
    amendments: FilingAmendment[];
    dependencies: string[];
    regulatoryAuthority: string;
    submissionMethod: 'IARD' | 'EDGAR' | 'CRD' | 'FINRA_GATEWAY' | 'PAPER' | 'EMAIL';
}
export interface FilingAmendment {
    id: string;
    amendmentNumber: number;
    reason: string;
    filedDate: Date;
    description: string;
    affectedSections: string[];
}
export interface ComplianceOfficer {
    id: string;
    name: string;
    title: string;
    crd?: string;
    qualifications: string[];
    certifications: Certification[];
    startDate: Date;
    contactInfo: ContactInfo;
    responsibilities: string[];
    reportingStructure: string[];
}
export interface Certification {
    id: string;
    name: string;
    issuingBody: string;
    certificationNumber: string;
    issuedDate: Date;
    expirationDate?: Date;
    status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
    continuingEducationRequired: boolean;
}
export interface ContactInfo {
    email: string;
    phone: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
}
export interface SupervisoryStructure {
    supervisorySystem: 'BRANCH' | 'OSJ' | 'CENTRALIZED' | 'HYBRID';
    supervisors: Supervisor[];
    reviewCycles: ReviewCycle[];
    escalationProcedures: EscalationProcedure[];
}
export interface Supervisor {
    id: string;
    name: string;
    crd: string;
    title: string;
    supervisoryResponsibilities: string[];
    supervisees: string[];
    qualifications: string[];
    designations: string[];
}
export interface ReviewCycle {
    id: string;
    reviewType: 'TRADE_REVIEW' | 'CORRESPONDENCE' | 'ADVERTISING' | 'CUSTOMER_COMPLAINTS' | 'BOOKS_RECORDS' | 'BRANCH_INSPECTION';
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
    scope: string;
    methodology: string;
    documentation: string;
    responsibleParty: string;
}
export interface EscalationProcedure {
    id: string;
    triggerCondition: string;
    escalationLevel: number;
    escalateTo: string;
    timeframe: string;
    requiredActions: string[];
    documentation: string;
}
export interface BusinessActivity {
    activityType: 'SECURITIES_BROKERAGE' | 'INVESTMENT_ADVISORY' | 'UNDERWRITING' | 'MARKET_MAKING' | 'PROPRIETARY_TRADING' | 'COMMODITIES' | 'INSURANCE' | 'BANKING';
    description: string;
    clientTypes: string[];
    productTypes: string[];
    geographicScope: string[];
    revenue: number;
    percentageOfBusiness: number;
    regulatoryRequirements: string[];
}
export interface ClientType {
    type: 'RETAIL' | 'INSTITUTIONAL' | 'QUALIFIED_PURCHASER' | 'ACCREDITED_INVESTOR' | 'PENSION_FUND' | 'ENDOWMENT' | 'SOVEREIGN_WEALTH' | 'FAMILY_OFFICE';
    count: number;
    averageAccountSize: number;
    suitabilityRequirements: string[];
    disclosureRequirements: string[];
}
export interface CustodyArrangement {
    custodianName: string;
    custodianType: 'QUALIFIED_CUSTODIAN' | 'BANK' | 'BROKER_DEALER' | 'FOREIGN_FINANCIAL_INSTITUTION';
    services: string[];
    assetsHeld: number;
    agreement: {
        effectiveDate: Date;
        expirationDate?: Date;
        terms: string[];
    };
    auditor?: string;
    auditFrequency?: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY';
}
export interface ComplianceViolation {
    id: string;
    violationType: 'REGULATORY' | 'POLICY' | 'ETHICAL' | 'OPERATIONAL';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    regulator?: string;
    regulation: string;
    section: string;
    description: string;
    discoveredDate: Date;
    discoveredBy: string;
    affectedParties: string[];
    potentialImpact: string;
    rootCause: string;
    correctiveActions: CorrectiveAction[];
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    reportingRequired: boolean;
    reportingDeadline?: Date;
    reportingStatus?: 'NOT_REQUIRED' | 'PENDING' | 'SUBMITTED' | 'ACKNOWLEDGED';
    monetary: {
        estimatedLoss?: number;
        actualLoss?: number;
        potentialFine?: number;
        actualFine?: number;
    };
}
export interface CorrectiveAction {
    id: string;
    action: string;
    assignedTo: string;
    dueDate: Date;
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    completedDate?: Date;
    evidence?: string;
    effectiveness: 'NOT_ASSESSED' | 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE';
}
export interface SuitabilityAssessment {
    id: string;
    clientId: string;
    assessmentDate: Date;
    conductedBy: string;
    clientProfile: {
        age: number;
        investmentExperience: 'NONE' | 'LIMITED' | 'GOOD' | 'EXTENSIVE';
        financialSituation: {
            annualIncome: number;
            netWorth: number;
            liquidNetWorth: number;
            investmentObjectives: string[];
            timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
            riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'VERY_AGGRESSIVE';
        };
        investmentConstraints: string[];
    };
    productAssessment: {
        productType: string;
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
        complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'VERY_COMPLEX';
        features: string[];
        costs: CostStructure;
    };
    suitabilityDetermination: 'SUITABLE' | 'UNSUITABLE' | 'CONDITIONALLY_SUITABLE';
    reasoning: string;
    conditions?: string[];
    recommendedAlternatives?: string[];
    clientAcknowledgment: boolean;
    supervisoryReview: {
        reviewedBy: string;
        reviewDate: Date;
        approved: boolean;
        comments?: string;
    };
}
export interface CostStructure {
    managementFee?: number;
    performanceFee?: number;
    salesCharge?: number;
    redemptionFee?: number;
    expenses?: number;
    totalExpenseRatio?: number;
    estimatedAnnualCost: number;
}
export interface BestExecutionAnalysis {
    id: string;
    analysisPeriod: {
        startDate: Date;
        endDate: Date;
    };
    orderType: string;
    securityType: string;
    marketCenters: MarketCenter[];
    executionMetrics: ExecutionMetrics;
    qualityMetrics: QualityMetrics;
    complianceAssessment: string;
    improvements: string[];
    reportGenerated: Date;
    reportPeriod: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
}
export interface MarketCenter {
    name: string;
    marketCenterType: 'EXCHANGE' | 'ATS' | 'MARKET_MAKER' | 'ELECTRONIC_NETWORK';
    orderVolume: number;
    orderValue: number;
    percentageOfVolume: number;
    averageExecutionTime: number;
    priceImprovement: number;
    executionQuality: number;
}
export interface ExecutionMetrics {
    totalOrders: number;
    totalShares: number;
    totalValue: number;
    averageOrderSize: number;
    fillRate: number;
    partialFillRate: number;
    marketableOrderRate: number;
    averageRealizationRate: number;
}
export interface QualityMetrics {
    priceImprovement: {
        orders: number;
        improvementAmount: number;
        averageImprovement: number;
    };
    atMidpoint: {
        orders: number;
        percentage: number;
    };
    outsideQuote: {
        orders: number;
        percentage: number;
    };
    speedOfExecution: {
        averageTime: number;
        medianTime: number;
        percentile95: number;
    };
}
export interface AntiMoneyLaunderingCheck {
    id: string;
    clientId: string;
    checkType: 'INITIAL' | 'PERIODIC' | 'ENHANCED' | 'TRANSACTION_BASED';
    checkDate: Date;
    screeningResults: ScreeningResult[];
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PROHIBITED';
    sanctions: SanctionsCheck;
    pep: PEPCheck;
    adverseMedia: AdverseMediaCheck;
    complianceDecision: 'APPROVED' | 'REJECTED' | 'REQUIRES_REVIEW' | 'ENHANCED_DUE_DILIGENCE';
    dueDiligenceLevel: 'STANDARD' | 'ENHANCED' | 'SIMPLIFIED';
    monitoringFrequency: 'REAL_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
    nextReviewDate: Date;
    reviewedBy: string;
    approvedBy?: string;
    comments?: string;
}
export interface ScreeningResult {
    provider: string;
    listName: string;
    matchType: 'EXACT' | 'FUZZY' | 'PHONETIC';
    confidence: number;
    matchDetails: string;
    falsePositive: boolean;
    resolvedBy?: string;
    resolvedDate?: Date;
    resolution?: string;
}
export interface SanctionsCheck {
    lists: string[];
    matches: number;
    highestRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
    details: string[];
}
export interface PEPCheck {
    isPEP: boolean;
    pepType?: 'DOMESTIC' | 'FOREIGN' | 'INTERNATIONAL_ORGANIZATION';
    position?: string;
    jurisdiction?: string;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    enhancedDueDiligence: boolean;
}
export interface AdverseMediaCheck {
    found: boolean;
    sources: string[];
    categories: string[];
    riskScore: number;
    summary?: string;
}
export interface TradeReporting {
    id: string;
    tradeId: string;
    reportingRegime: 'CAT' | 'OATS' | 'BLUE_SHEETS' | 'LARGE_TRADER' | 'FORM_13F' | 'SECTION_16' | 'EMIR' | 'MIFID_II';
    reportingDeadline: Date;
    reportingStatus: 'PENDING' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'REJECTED' | 'LATE';
    reportingErrors?: ReportingError[];
    submissionDate?: Date;
    acknowledgmentDate?: Date;
    reportingFields: Record<string, any>;
    regulatoryAuthority: string;
    corrections: TradeReportingCorrection[];
}
export interface ReportingError {
    errorCode: string;
    errorMessage: string;
    fieldName?: string;
    severity: 'WARNING' | 'ERROR' | 'FATAL';
    resolution?: string;
}
export interface TradeReportingCorrection {
    correctionId: string;
    correctionDate: Date;
    reason: string;
    originalValue: any;
    correctedValue: any;
    submittedBy: string;
    status: 'PENDING' | 'SUBMITTED' | 'ACKNOWLEDGED';
}
export interface ComplianceTraining {
    id: string;
    trainingProgram: string;
    trainingType: 'REGULATORY_ELEMENT' | 'FIRM_ELEMENT' | 'CONTINUING_EDUCATION' | 'INITIAL_TRAINING' | 'ANNUAL_COMPLIANCE';
    requiredFor: string[];
    completionDeadline: Date;
    trainingProvider: string;
    duration: number;
    completionCriteria: string;
    assessmentRequired: boolean;
    passingScore?: number;
    certificateIssued: boolean;
    regulatoryRequirement?: string;
    participants: TrainingParticipant[];
}
export interface TrainingParticipant {
    employeeId: string;
    enrollmentDate: Date;
    startDate?: Date;
    completionDate?: Date;
    status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'OVERDUE';
    score?: number;
    attempts: number;
    certificateNumber?: string;
    exemptionReason?: string;
}
export interface FinancialServicesConfig {
    service: {
        port: number;
        host: string;
        environment: 'development' | 'staging' | 'production';
    };
    database: {
        redis: {
            host: string;
            port: number;
            password?: string;
            db: number;
        };
    };
    compliance: {
        violationThresholds: {
            monetary: number;
            operational: number;
            reputational: number;
        };
        reportingDeadlines: {
            routine: number;
            material: number;
            immediate: number;
        };
        reviewCycles: {
            suitability: number;
            bestExecution: number;
            aml: number;
            trading: number;
        };
    };
    regulators: {
        sec: {
            enabled: boolean;
            filingSystem: 'EDGAR' | 'IARD';
            credentials?: {
                username: string;
                password: string;
                cik: string;
            };
        };
        finra: {
            enabled: boolean;
            gateway: string;
            credentials?: {
                username: string;
                password: string;
                firmId: string;
            };
        };
        cftc: {
            enabled: boolean;
            filingSystem: string;
            credentials?: {
                username: string;
                password: string;
                nfaId: string;
            };
        };
    };
    monitoring: {
        realTimeAlerts: boolean;
        alertThresholds: {
            violations: number;
            exposure: number;
            concentration: number;
        };
        dashboardRefresh: number;
    };
    integrations: {
        tradingSystem: string;
        portfolioManagement: string;
        riskManagement: string;
        clientManagement: string;
    };
}
export interface ComplianceReport {
    id: string;
    reportType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'AD_HOC' | 'REGULATORY_EXAM';
    reportPeriod: {
        startDate: Date;
        endDate: Date;
    };
    generatedDate: Date;
    generatedBy: string;
    approvedBy?: string;
    approvalDate?: Date;
    sections: ReportSection[];
    summary: ComplianceSummary;
    recommendations: string[];
    actionItems: ActionItem[];
    attachments: string[];
    distribution: string[];
    confidentialityLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
}
export interface ReportSection {
    sectionName: string;
    content: string;
    charts?: ChartData[];
    tables?: TableData[];
    findings: string[];
    metrics: Record<string, number>;
}
export interface ChartData {
    chartType: 'LINE' | 'BAR' | 'PIE' | 'AREA' | 'SCATTER';
    title: string;
    data: any[];
    xAxis?: string;
    yAxis?: string;
}
export interface TableData {
    headers: string[];
    rows: any[][];
    summary?: Record<string, any>;
}
export interface ComplianceSummary {
    overallScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    violations: {
        total: number;
        open: number;
        resolved: number;
        byCategory: Record<string, number>;
    };
    regulatory: {
        examinations: number;
        findings: number;
        fines: number;
        totalFineAmount: number;
    };
    operational: {
        trainingCompliance: number;
        systemUptime: number;
        processEfficiency: number;
    };
    trends: {
        improving: string[];
        declining: string[];
        stable: string[];
    };
}
export interface ActionItem {
    id: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    assignedTo: string;
    dueDate: Date;
    category: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    dependencies?: string[];
    estimatedEffort: string;
}

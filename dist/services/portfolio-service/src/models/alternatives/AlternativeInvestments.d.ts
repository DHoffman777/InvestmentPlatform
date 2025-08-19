export declare enum AlternativeInvestmentType {
    PRIVATE_EQUITY = "PRIVATE_EQUITY",
    HEDGE_FUND = "HEDGE_FUND",
    VENTURE_CAPITAL = "VENTURE_CAPITAL",
    REAL_ESTATE = "REAL_ESTATE",
    INFRASTRUCTURE = "INFRASTRUCTURE",
    COMMODITY_FUND = "COMMODITY_FUND",
    PRIVATE_DEBT = "PRIVATE_DEBT",
    FUND_OF_FUNDS = "FUND_OF_FUNDS",
    DIRECT_INVESTMENT = "DIRECT_INVESTMENT",
    REIT_PRIVATE = "REIT_PRIVATE"
}
export declare enum InvestmentStage {
    SEED = "SEED",
    SERIES_A = "SERIES_A",
    SERIES_B = "SERIES_B",
    SERIES_C = "SERIES_C",
    LATE_STAGE = "LATE_STAGE",
    GROWTH = "GROWTH",
    BUYOUT = "BUYOUT",
    DISTRESSED = "DISTRESSED",
    TURNAROUND = "TURNAROUND",
    MEZZANINE = "MEZZANINE"
}
export declare enum FundStatus {
    FUNDRAISING = "FUNDRAISING",
    INVESTING = "INVESTING",
    HARVESTING = "HARVESTING",
    LIQUIDATING = "LIQUIDATING",
    CLOSED = "CLOSED"
}
export declare enum CommitmentStatus {
    COMMITTED = "COMMITTED",
    CALLED = "CALLED",
    INVESTED = "INVESTED",
    REALIZED = "REALIZED",
    WRITTEN_OFF = "WRITTEN_OFF"
}
export declare enum DistributionType {
    CASH = "CASH",
    STOCK = "STOCK",
    PIK = "PIK",// Payment in Kind
    RETURN_OF_CAPITAL = "RETURN_OF_CAPITAL",
    CAPITAL_GAIN = "CAPITAL_GAIN"
}
export declare enum ValuationMethod {
    MARKET_MULTIPLE = "MARKET_MULTIPLE",
    DCF = "DCF",// Discounted Cash Flow
    TRANSACTION_MULTIPLE = "TRANSACTION_MULTIPLE",
    ASSET_BASED = "ASSET_BASED",
    COST_BASIS = "COST_BASIS",
    THIRD_PARTY = "THIRD_PARTY",
    MARK_TO_MARKET = "MARK_TO_MARKET"
}
export declare enum GeographicFocus {
    NORTH_AMERICA = "NORTH_AMERICA",
    EUROPE = "EUROPE",
    ASIA_PACIFIC = "ASIA_PACIFIC",
    EMERGING_MARKETS = "EMERGING_MARKETS",
    GLOBAL = "GLOBAL",
    CHINA = "CHINA",
    INDIA = "INDIA",
    LATIN_AMERICA = "LATIN_AMERICA"
}
export declare enum SectorFocus {
    TECHNOLOGY = "TECHNOLOGY",
    HEALTHCARE = "HEALTHCARE",
    FINANCIAL_SERVICES = "FINANCIAL_SERVICES",
    ENERGY = "ENERGY",
    INDUSTRIALS = "INDUSTRIALS",
    CONSUMER = "CONSUMER",
    REAL_ESTATE = "REAL_ESTATE",
    INFRASTRUCTURE = "INFRASTRUCTURE",
    DIVERSIFIED = "DIVERSIFIED"
}
export interface AlternativeInvestment {
    id: string;
    tenantId: string;
    investmentName: string;
    investmentType: AlternativeInvestmentType;
    fundName?: string;
    fundId?: string;
    generalPartner: string;
    administrator?: string;
    vintage: number;
    fundSize?: number;
    currency: string;
    investmentStage?: InvestmentStage;
    geographicFocus: GeographicFocus[];
    sectorFocus: SectorFocus[];
    commitment: number;
    managementFee: number;
    carriedInterest: number;
    hurdle?: number;
    catchUp?: number;
    commitmentDate: Date;
    firstClosingDate?: Date;
    finalClosingDate?: Date;
    investmentPeriod?: {
        startDate: Date;
        endDate: Date;
    };
    fundTerm: number;
    status: FundStatus;
    isActive: boolean;
    currentNAV?: number;
    totalCalled: number;
    totalDistributed: number;
    unrealizedValue: number;
    cusip?: string;
    isin?: string;
    lei?: string;
    documents: InvestmentDocument[];
    riskRating?: string;
    esgScore?: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
export interface CapitalCall {
    id: string;
    investmentId: string;
    tenantId: string;
    callNumber: number;
    callDate: Date;
    dueDate: Date;
    callAmount: number;
    purpose: string;
    investmentAllocations: CallAllocation[];
    managementFeeAmount?: number;
    expenseAmount?: number;
    status: CommitmentStatus;
    fundedDate?: Date;
    fundedAmount?: number;
    interestRate?: number;
    penaltyRate?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface CallAllocation {
    portfolioCompanyId?: string;
    portfolioCompanyName?: string;
    allocationAmount: number;
    allocationPercentage: number;
    purpose: string;
}
export interface Distribution {
    id: string;
    investmentId: string;
    tenantId: string;
    distributionNumber: number;
    distributionDate: Date;
    paymentDate: Date;
    totalAmount: number;
    distributionComponents: DistributionComponent[];
    taxableAmount?: number;
    returnOfCapital?: number;
    capitalGain?: number;
    sourceCompanies: DistributionSource[];
    status: 'ANNOUNCED' | 'PAID' | 'PENDING' | 'CANCELLED';
    createdAt: Date;
    updatedAt: Date;
}
export interface DistributionComponent {
    type: DistributionType;
    amount: number;
    currency: string;
    description?: string;
}
export interface DistributionSource {
    portfolioCompanyId?: string;
    portfolioCompanyName?: string;
    sourceAmount: number;
    sourceType: 'EXIT' | 'DIVIDEND' | 'RECAPITALIZATION' | 'OTHER';
}
export interface NAVUpdate {
    id: string;
    investmentId: string;
    tenantId: string;
    asOfDate: Date;
    reportingDate: Date;
    netAssetValue: number;
    sharePrice?: number;
    grossAssetValue: number;
    totalLiabilities: number;
    unrealizedGain: number;
    realizedGain: number;
    irr?: number;
    multiple?: number;
    pmeIndex?: number;
    valuationMethod: ValuationMethod;
    valuationSource: 'FUND_REPORT' | 'THIRD_PARTY' | 'INTERNAL' | 'AUDITED';
    portfolioCompanies: PortfolioCompanyValuation[];
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    dataQualityScore: number;
    createdAt: Date;
    updatedBy: string;
}
export interface PortfolioCompanyValuation {
    companyId: string;
    companyName: string;
    sector: string;
    valuation: number;
    valuationMethod: ValuationMethod;
    ownership: number;
    costBasis: number;
    unrealizedGain: number;
    isPartialRealization: boolean;
}
export interface PortfolioCompany {
    id: string;
    investmentId: string;
    tenantId: string;
    companyName: string;
    businessDescription: string;
    sector: SectorFocus;
    geography: GeographicFocus;
    initialInvestmentDate: Date;
    initialInvestmentAmount: number;
    currentOwnership: number;
    totalInvested: number;
    currentRevenue?: number;
    currentEBITDA?: number;
    employeeCount?: number;
    ceo?: string;
    boardMembers: BoardMember[];
    investmentThesis: string;
    keyValueDrivers: string[];
    exitStrategy?: string;
    status: 'ACTIVE' | 'EXITED' | 'WRITTEN_OFF' | 'BANKRUPTCY';
    performanceMetrics: CompanyPerformanceMetric[];
    exitDate?: Date;
    exitValuation?: number;
    exitMultiple?: number;
    exitType?: 'IPO' | 'TRADE_SALE' | 'SECONDARY' | 'WRITE_OFF';
    createdAt: Date;
    updatedAt: Date;
}
export interface BoardMember {
    name: string;
    role: string;
    appointedDate: Date;
    isIndependent: boolean;
}
export interface CompanyPerformanceMetric {
    metricName: string;
    value: number;
    unit: string;
    asOfDate: Date;
    isAudited: boolean;
}
export interface JCurveAnalysis {
    id: string;
    investmentId: string;
    tenantId: string;
    analysisDate: Date;
    timeHorizon: number;
    jCurvePoints: JCurvePoint[];
    bottomOfJCurve: {
        date: Date;
        irr: number;
        multiple: number;
    };
    crossoverPoint?: {
        date: Date;
        irr: number;
        multiple: number;
    };
    projectedFinalMetrics: {
        projectedIRR: number;
        projectedMultiple: number;
        confidenceInterval: {
            low: number;
            high: number;
        };
    };
    peerGroupComparison?: {
        peerGroupName: string;
        relativeiRR: number;
        relativeMultiple: number;
    };
    createdAt: Date;
    updatedBy: string;
}
export interface JCurvePoint {
    date: Date;
    quartersSinceInception: number;
    cumulativeCashFlow: number;
    unrealizedValue: number;
    totalValue: number;
    irr: number;
    multiple: number;
}
export interface AlternativeInvestmentPosition {
    id: string;
    tenantId: string;
    portfolioId: string;
    investmentId: string;
    commitment: number;
    totalCalled: number;
    totalDistributed: number;
    currentNAV: number;
    unrealizedValue: number;
    currentIRR: number;
    currentMultiple: number;
    unfundedCommitment: number;
    distributedToInvested: number;
    residualToInvested: number;
    totalToInvested: number;
    totalCashInvested: number;
    totalCashReceived: number;
    netCashFlow: number;
    concentrationRisk: number;
    liquidityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    isActive: boolean;
    lastValuationDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface InvestmentDocument {
    id: string;
    investmentId: string;
    documentType: DocumentType;
    documentName: string;
    fileName: string;
    filePath: string;
    uploadDate: Date;
    uploadedBy: string;
    fileSize: number;
    mimeType: string;
    confidentialityLevel: 'PUBLIC' | 'CONFIDENTIAL' | 'RESTRICTED';
    documentCategory: 'LEGAL' | 'FINANCIAL' | 'OPERATIONAL' | 'COMPLIANCE';
    version: number;
    isLatestVersion: boolean;
    accessList: string[];
    createdAt: Date;
}
export declare enum DocumentType {
    PRIVATE_PLACEMENT_MEMORANDUM = "PRIVATE_PLACEMENT_MEMORANDUM",
    LIMITED_PARTNERSHIP_AGREEMENT = "LIMITED_PARTNERSHIP_AGREEMENT",
    SUBSCRIPTION_AGREEMENT = "SUBSCRIPTION_AGREEMENT",
    QUARTERLY_REPORT = "QUARTERLY_REPORT",
    ANNUAL_REPORT = "ANNUAL_REPORT",
    CAPITAL_CALL_NOTICE = "CAPITAL_CALL_NOTICE",
    DISTRIBUTION_NOTICE = "DISTRIBUTION_NOTICE",
    NAV_STATEMENT = "NAV_STATEMENT",
    AUDIT_REPORT = "AUDIT_REPORT",
    TAX_DOCUMENT = "TAX_DOCUMENT",
    SIDE_LETTER = "SIDE_LETTER",
    AMENDMENT = "AMENDMENT"
}
export interface FundAnalytics {
    investmentId: string;
    tenantId: string;
    asOfDate: Date;
    performanceSummary: {
        totalCommitment: number;
        totalCalled: number;
        totalDistributed: number;
        currentNAV: number;
        grossIRR: number;
        netIRR: number;
        grossMultiple: number;
        netMultiple: number;
        dpi: number;
        rvpi: number;
        tvpi: number;
    };
    benchmarkComparison: {
        benchmarkName: string;
        benchmarkIRR: number;
        benchmarkMultiple: number;
        relativePerformance: number;
        percentileRanking: number;
    };
    riskMetrics: {
        volatility: number;
        downSideDeviation: number;
        maxDrawdown: number;
        sharpeRatio: number;
        betaToPublicMarkets?: number;
    };
    concentrationMetrics: {
        portfolioCompanyCount: number;
        top5Concentration: number;
        top10Concentration: number;
        sectorConcentration: Record<string, number>;
        geographicConcentration: Record<string, number>;
    };
    cashFlowMetrics: {
        averageHoldPeriod: number;
        timeToFirstDistribution: number;
        distributionFrequency: number;
        callingPattern: CallPattern[];
    };
    calculatedAt: Date;
    calculatedBy: string;
}
export interface CallPattern {
    year: number;
    quarterlyCallAmounts: number[];
    cumulativeCallRate: number;
}
export interface CreateAlternativeInvestmentRequest {
    investmentData: Omit<AlternativeInvestment, 'id' | 'createdAt' | 'updatedAt'>;
    initialCommitment?: {
        portfolioId: string;
        commitmentAmount: number;
    };
}
export interface AlternativeInvestmentSearchRequest {
    tenantId: string;
    investmentTypes?: AlternativeInvestmentType[];
    generalPartners?: string[];
    vintages?: number[];
    sectorFocus?: SectorFocus[];
    geographicFocus?: GeographicFocus[];
    fundStatuses?: FundStatus[];
    commitmentRange?: {
        min: number;
        max: number;
    };
    performanceMetrics?: {
        minIRR?: number;
        minMultiple?: number;
    };
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export interface AlternativeInvestmentSearchResponse {
    investments: AlternativeInvestment[];
    total: number;
    aggregations: {
        byInvestmentType: Record<AlternativeInvestmentType, number>;
        byVintage: Record<number, number>;
        bySectorFocus: Record<SectorFocus, number>;
        byGeographicFocus: Record<GeographicFocus, number>;
        totalCommitments: number;
        averageCommitment: number;
        totalNAV: number;
    };
    pagination: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}
export interface PortfolioAlternativesAnalytics {
    portfolioId: string;
    tenantId: string;
    asOfDate: Date;
    summary: {
        totalInvestments: number;
        totalCommitments: number;
        totalCalled: number;
        totalDistributed: number;
        totalNAV: number;
        unfundedCommitments: number;
        weightedAverageIRR: number;
        weightedAverageMultiple: number;
    };
    diversification: {
        byInvestmentType: Record<AlternativeInvestmentType, number>;
        byVintage: Record<number, number>;
        bySector: Record<SectorFocus, number>;
        byGeography: Record<GeographicFocus, number>;
        byGeneralPartner: Record<string, number>;
    };
    performance: {
        topPerformers: {
            investmentId: string;
            investmentName: string;
            irr: number;
            multiple: number;
        }[];
        underPerformers: {
            investmentId: string;
            investmentName: string;
            irr: number;
            multiple: number;
        }[];
        vintagePerformance: Record<number, {
            irr: number;
            multiple: number;
            count: number;
        }>;
    };
    liquidityProfile: {
        expectedDistributions: {
            year: number;
            expectedAmount: number;
        }[];
        expectedCapitalCalls: {
            year: number;
            expectedAmount: number;
        }[];
        liquidityRatio: number;
    };
    riskMetrics: {
        concentrationRisk: number;
        vintageConcentration: number;
        gpConcentration: number;
        illiquidityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    };
}
export interface ESGMetrics {
    investmentId: string;
    asOfDate: Date;
    overallESGScore: number;
    environmentalScore: number;
    socialScore: number;
    governanceScore: number;
    carbonFootprint?: number;
    diversityMetrics?: {
        boardDiversity: number;
        workforceDiversity: number;
        leadershipDiversity: number;
    };
    impactMetrics?: {
        metricName: string;
        value: number;
        unit: string;
        targetValue?: number;
    }[];
    sustainabilityCompliance: boolean;
    impactReportingCompliance: boolean;
    lastUpdated: Date;
    dataSource: string;
}

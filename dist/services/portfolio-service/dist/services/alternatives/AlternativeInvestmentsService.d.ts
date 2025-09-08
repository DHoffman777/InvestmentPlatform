export const __esModule: boolean;
export class AlternativeInvestmentsService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    createInvestment(request: any, tenantId: any, userId: any): Promise<any>;
    getInvestment(investmentId: any, tenantId: any): Promise<any>;
    updateInvestment(investmentId: any, updates: any, tenantId: any, userId: any): Promise<any>;
    searchInvestments(request: any): Promise<{
        investments: any[];
        total: number;
        aggregations: {
            byInvestmentType: {};
            byVintage: {};
            bySectorFocus: {};
            byGeographicFocus: {};
            totalCommitments: number;
            averageCommitment: number;
            totalNAV: number;
        };
        pagination: {
            limit: any;
            offset: any;
            hasMore: boolean;
        };
    }>;
    processCapitalCall(investmentId: any, callData: any, tenantId: any, userId: any): Promise<{
        id: string;
        investmentId: any;
        tenantId: any;
        callNumber: any;
        callDate: Date;
        dueDate: any;
        callAmount: any;
        purpose: any;
        investmentAllocations: any[];
        managementFeeAmount: any;
        expenseAmount: any;
        status: AlternativeInvestments_1.CommitmentStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
    fundCapitalCall(callId: any, fundedAmount: any, tenantId: any, userId: any): Promise<{
        id: any;
        investmentId: string;
        tenantId: any;
        callNumber: number;
        callDate: Date;
        dueDate: Date;
        callAmount: number;
        purpose: string;
        investmentAllocations: any[];
        status: AlternativeInvestments_1.CommitmentStatus;
        fundedDate: Date;
        fundedAmount: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
    processDistribution(investmentId: any, distributionData: any, tenantId: any, userId: any): Promise<{
        id: string;
        investmentId: any;
        tenantId: any;
        distributionNumber: any;
        distributionDate: Date;
        paymentDate: any;
        totalAmount: any;
        distributionComponents: {
            type: AlternativeInvestments_1.DistributionType;
            amount: any;
            currency: string;
        }[];
        taxableAmount: any;
        returnOfCapital: any;
        capitalGain: any;
        sourceCompanies: any[];
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateNAV(investmentId: any, navData: any, tenantId: any, userId: any): Promise<{
        id: string;
        investmentId: any;
        tenantId: any;
        asOfDate: any;
        reportingDate: Date;
        netAssetValue: any;
        grossAssetValue: any;
        totalLiabilities: any;
        unrealizedGain: any;
        realizedGain: any;
        irr: any;
        multiple: any;
        valuationMethod: string;
        valuationSource: string;
        portfolioCompanies: any[];
        confidenceLevel: string;
        dataQualityScore: number;
        createdAt: Date;
        updatedBy: any;
    }>;
    generateJCurveAnalysis(investmentId: any, analysisParams: any, tenantId: any, userId: any): Promise<{
        id: string;
        investmentId: any;
        tenantId: any;
        analysisDate: Date;
        timeHorizon: any;
        jCurvePoints: any[];
        bottomOfJCurve: {
            date: any;
            irr: any;
            multiple: any;
        };
        crossoverPoint: {
            date: any;
            irr: any;
            multiple: any;
        };
        projectedFinalMetrics: {
            projectedIRR: any;
            projectedMultiple: any;
            confidenceInterval: {
                low: number;
                high: any;
            };
        };
        createdAt: Date;
        updatedBy: any;
    }>;
    addPortfolioCompany(investmentId: any, companyData: any, tenantId: any, userId: any): Promise<any>;
    createPosition(investmentId: any, portfolioId: any, commitmentAmount: any, tenantId: any, userId: any): Promise<{
        id: string;
        tenantId: any;
        portfolioId: any;
        investmentId: any;
        commitment: any;
        totalCalled: number;
        totalDistributed: number;
        currentNAV: any;
        unrealizedValue: any;
        currentIRR: number;
        currentMultiple: number;
        unfundedCommitment: any;
        distributedToInvested: number;
        residualToInvested: number;
        totalToInvested: number;
        totalCashInvested: number;
        totalCashReceived: number;
        netCashFlow: number;
        concentrationRisk: number;
        liquidityRisk: string;
        isActive: boolean;
        lastValuationDate: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateFundAnalytics(investmentId: any, asOfDate: any, tenantId: any): Promise<{
        investmentId: any;
        tenantId: any;
        asOfDate: any;
        performanceSummary: {
            totalCommitment: any;
            totalCalled: any;
            totalDistributed: any;
            currentNAV: any;
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
        };
        concentrationMetrics: {
            portfolioCompanyCount: number;
            top5Concentration: number;
            top10Concentration: number;
            sectorConcentration: {};
            geographicConcentration: {};
        };
        cashFlowMetrics: {
            averageHoldPeriod: number;
            timeToFirstDistribution: number;
            distributionFrequency: number;
            callingPattern: any[];
        };
        calculatedAt: Date;
        calculatedBy: string;
    }>;
    generatePortfolioAnalytics(portfolioId: any, asOfDate: any, tenantId: any): Promise<{
        portfolioId: any;
        tenantId: any;
        asOfDate: any;
        summary: {
            totalInvestments: any;
            totalCommitments: number;
            totalCalled: number;
            totalDistributed: number;
            totalNAV: number;
            unfundedCommitments: number;
            weightedAverageIRR: number;
            weightedAverageMultiple: number;
        };
        diversification: {
            byInvestmentType: {};
            byVintage: {};
            bySector: {};
            byGeography: {};
            byGeneralPartner: {};
        };
        performance: {
            topPerformers: any[];
            underPerformers: any[];
            vintagePerformance: {};
        };
        liquidityProfile: {
            expectedDistributions: any[];
            expectedCapitalCalls: any[];
            liquidityRatio: number;
        };
        riskMetrics: {
            concentrationRisk: number;
            vintageConcentration: number;
            gpConcentration: number;
            illiquidityRisk: string;
        };
    }>;
    updateESGMetrics(investmentId: any, esgData: any, tenantId: any): Promise<any>;
    validateInvestmentData(data: any): Promise<void>;
    storeInvestment(investment: any): Promise<void>;
    storeCapitalCall(capitalCall: any): Promise<void>;
    storeDistribution(distribution: any): Promise<void>;
    storeNAVUpdate(navUpdate: any): Promise<void>;
    storeJCurveAnalysis(analysis: any): Promise<void>;
    storePortfolioCompany(company: any): Promise<void>;
    storePosition(position: any): Promise<void>;
    storeESGMetrics(metrics: any): Promise<void>;
    setupFundMonitoring(investment: any): Promise<void>;
    publishInvestmentEvent(eventType: any, investment: any): Promise<void>;
    publishCapitalCallEvent(eventType: any, capitalCall: any): Promise<void>;
    publishDistributionEvent(eventType: any, distribution: any): Promise<void>;
    publishNAVEvent(eventType: any, navUpdate: any): Promise<void>;
    publishPortfolioCompanyEvent(eventType: any, company: any): Promise<void>;
    publishPositionEvent(eventType: any, position: any): Promise<void>;
    publishESGEvent(eventType: any, metrics: any): Promise<void>;
    calculateJCurvePoints(investmentId: any, timeHorizon: any): Promise<any[]>;
    calculatePerformanceSummary(investment: any): Promise<{
        totalCommitment: any;
        totalCalled: any;
        totalDistributed: any;
        currentNAV: any;
        grossIRR: number;
        netIRR: number;
        grossMultiple: number;
        netMultiple: number;
        dpi: number;
        rvpi: number;
        tvpi: number;
    }>;
    getBenchmarkComparison(investment: any): Promise<{
        benchmarkName: string;
        benchmarkIRR: number;
        benchmarkMultiple: number;
        relativePerformance: number;
        percentileRanking: number;
    }>;
    calculateRiskMetrics(investment: any): Promise<{
        volatility: number;
        downSideDeviation: number;
        maxDrawdown: number;
        sharpeRatio: number;
    }>;
    calculateConcentrationMetrics(investment: any): Promise<{
        portfolioCompanyCount: number;
        top5Concentration: number;
        top10Concentration: number;
        sectorConcentration: {};
        geographicConcentration: {};
    }>;
    calculateCashFlowMetrics(investment: any): Promise<{
        averageHoldPeriod: number;
        timeToFirstDistribution: number;
        distributionFrequency: number;
        callingPattern: any[];
    }>;
    getPortfolioPositions(portfolioId: any, tenantId: any): Promise<any[]>;
    calculatePortfolioSummary(positions: any): Promise<{
        totalInvestments: any;
        totalCommitments: number;
        totalCalled: number;
        totalDistributed: number;
        totalNAV: number;
        unfundedCommitments: number;
        weightedAverageIRR: number;
        weightedAverageMultiple: number;
    }>;
    calculateDiversification(positions: any): Promise<{
        byInvestmentType: {};
        byVintage: {};
        bySector: {};
        byGeography: {};
        byGeneralPartner: {};
    }>;
    calculatePortfolioPerformance(positions: any): Promise<{
        topPerformers: any[];
        underPerformers: any[];
        vintagePerformance: {};
    }>;
    calculateLiquidityProfile(positions: any): Promise<{
        expectedDistributions: any[];
        expectedCapitalCalls: any[];
        liquidityRatio: number;
    }>;
    calculatePortfolioRisk(positions: any): Promise<{
        concentrationRisk: number;
        vintageConcentration: number;
        gpConcentration: number;
        illiquidityRisk: string;
    }>;
    updateInvestmentCallTotals(investmentId: any, callAmount: any): Promise<void>;
    updateInvestmentFundedTotals(investmentId: any, fundedAmount: any): Promise<void>;
    updateInvestmentDistributionTotals(investmentId: any, distributionAmount: any): Promise<void>;
    updateInvestmentCurrentNAV(investmentId: any, nav: any): Promise<void>;
    recalculatePositionValues(investmentId: any, nav: any): Promise<void>;
    processDistributionToPositions(distribution: any): Promise<void>;
    notifyCapitalCall(capitalCall: any): Promise<void>;
}
import AlternativeInvestments_1 = require("../../models/alternatives/AlternativeInvestments");

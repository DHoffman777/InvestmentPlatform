export const __esModule: boolean;
export class FixedIncomeAnalyticsService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    calculateYields(request: any, tenantId: any, userId: any): Promise<{
        securityId: any;
        calculationDate: Date;
        yields: {};
        warnings: string[];
        calculationTime: number;
    }>;
    calculateDurationConvexity(request: any, tenantId: any, userId: any): Promise<{
        securityId: any;
        calculationDate: Date;
        durationMetrics: {
            modifiedDuration: number;
            macaulayDuration: number;
            effectiveDuration: number;
            optionAdjustedDuration: number;
            dollarDuration: number;
            dv01: number;
            pv01: number;
            calculationDate: Date;
            yieldShock: any;
        };
        convexityMetrics: {
            convexity: number;
            effectiveConvexity: number;
            dollarConvexity: number;
            gamma: number;
            calculationDate: Date;
            yieldShock: any;
        };
        warnings: any[];
        calculationTime: number;
    }>;
    performCreditAnalysis(request: any, tenantId: any, userId: any): Promise<{
        securityId: any;
        calculationDate: Date;
        creditMetrics: {
            creditSpread: any;
            defaultProbability: number;
            recoveryRate: any;
            creditVaR: number;
            expectedLoss: number;
            unexpectedLoss: number;
            hazardRate: number;
            survivalProbability: number;
            calculationDate: Date;
            horizonDays: any;
            confidenceLevel: any;
        };
        warnings: any[];
        calculationTime: number;
    }>;
    calculatePortfolioAnalytics(portfolioId: any, tenantId: any, userId: any): Promise<{
        portfolioId: any;
        tenantId: any;
        analysisDate: Date;
        portfolioYield: number;
        portfolioDuration: number;
        portfolioConvexity: number;
        portfolioSpread: number;
        interestRateVaR: number;
        creditVaR: number;
        totalVaR: number;
        sectorAllocation: {
            sector: any;
            marketValue: any;
            percentage: number;
            averageYield: number;
            averageDuration: number;
            averageRating: string;
        }[];
        ratingAllocation: {
            rating: any;
            marketValue: any;
            percentage: number;
            averageYield: number;
            averageDuration: number;
        }[];
        maturityDistribution: {
            bucketName: string;
            marketValue: any;
            percentage: number;
            averageYield: number;
            averageDuration: number;
        }[];
        expectedCashFlows: any[];
        stressTestResults: {
            scenario: string;
            yieldShock: number;
            priceImpact: number;
            percentageImpact: number;
            durationContribution: number;
            convexityContribution: number;
        }[];
        createdAt: Date;
        calculationTime: number;
    }>;
    calculateYieldToMaturity(security: any, price: any, settlementDate: any): Promise<number>;
    calculateYieldToWorst(security: any, price: any, settlementDate: any): Promise<number>;
    calculateYieldToCall(security: any, price: any, settlementDate: any): Promise<number>;
    calculateCurrentYield(security: any, price: any): number;
    calculateTaxEquivalentYield(security: any, price: any, taxRate: any): Promise<number>;
    calculateOptionAdjustedYield(security: any, price: any, settlementDate: any): Promise<number>;
    calculateDurationMetrics(security: any, price: any, bondYield: any, settlementDate: any, yieldShock: any, durationTypes: any): Promise<{
        modifiedDuration: number;
        macaulayDuration: number;
        effectiveDuration: number;
        optionAdjustedDuration: number;
        dollarDuration: number;
        dv01: number;
        pv01: number;
        calculationDate: Date;
        yieldShock: any;
    }>;
    calculateModifiedDuration(security: any, bondYield: any, settlementDate: any): number;
    calculateMacaulayDuration(security: any, bondYield: any, settlementDate: any): number;
    calculateEffectiveDuration(security: any, price: any, bondYield: any, settlementDate: any, yieldShock: any): Promise<number>;
    calculateOptionAdjustedDuration(security: any, price: any, bondYield: any, settlementDate: any): Promise<number>;
    calculateConvexityMetrics(security: any, price: any, bondYield: any, settlementDate: any, yieldShock: any): Promise<{
        convexity: number;
        effectiveConvexity: number;
        dollarConvexity: number;
        gamma: number;
        calculationDate: Date;
        yieldShock: any;
    }>;
    calculateConvexity(security: any, bondYield: any, settlementDate: any, yieldShock: any): number;
    calculateEffectiveConvexity(security: any, price: any, bondYield: any, settlementDate: any, yieldShock: any): Promise<number>;
    calculateGamma(security: any, bondYield: any, settlementDate: any): number;
    calculateCreditMetrics(security: any, horizonDays: any, confidenceLevel: any, recoveryRate: any, includeRatingMigration: any): Promise<{
        creditSpread: any;
        defaultProbability: number;
        recoveryRate: any;
        creditVaR: number;
        expectedLoss: number;
        unexpectedLoss: number;
        hazardRate: number;
        survivalProbability: number;
        calculationDate: Date;
        horizonDays: any;
        confidenceLevel: any;
    }>;
    calculatePresentValue(security: any, bondYield: any, settlementDate: any): number;
    generateCashFlows(security: any, settlementDate: any): {
        date: Date;
        amount: any;
    }[];
    getPaymentFrequency(frequency: any): 2 | 1 | 4 | 365 | 12 | 52;
    calculatePeriods(startDate: any, endDate: any, frequency: any): number;
    getNextPaymentDate(currentDate: any, frequency: any): Date;
    calculateNumericalDuration(security: any, bondYield: any, settlementDate: any): number;
    calculateYieldToDate(security: any, price: any, settlementDate: any, targetDate: any, targetPrice: any): number;
    calculatePresentValueToDate(security: any, bondYield: any, settlementDate: any, targetDate: any, targetPrice: any): number;
    calculateDurationToDate(security: any, bondYield: any, settlementDate: any, targetDate: any): number;
    calculateDV01(security: any, bondYield: any, settlementDate: any): number;
    calculatePV01(security: any, bondYield: any, settlementDate: any): number;
    getFixedIncomeSecurity(securityId: any, tenantId: any): Promise<any>;
    getFixedIncomePositions(portfolioId: any, tenantId: any): Promise<any>;
    calculatePortfolioYield(positions: any): number;
    calculatePortfolioDuration(positions: any): number;
    calculatePortfolioConvexity(positions: any): number;
    calculatePortfolioSpread(positions: any): number;
    calculateSectorAllocation(positions: any): {
        sector: any;
        marketValue: any;
        percentage: number;
        averageYield: number;
        averageDuration: number;
        averageRating: string;
    }[];
    calculateRatingAllocation(positions: any): {
        rating: any;
        marketValue: any;
        percentage: number;
        averageYield: number;
        averageDuration: number;
    }[];
    calculateMaturityDistribution(positions: any): {
        bucketName: string;
        marketValue: any;
        percentage: number;
        averageYield: number;
        averageDuration: number;
    }[];
    projectCashFlows(positions: any, horizonDays: any): Promise<any[]>;
    performStressTesting(positions: any): Promise<{
        scenario: string;
        yieldShock: number;
        priceImpact: number;
        percentageImpact: number;
        durationContribution: number;
        convexityContribution: number;
    }[]>;
    calculateInterestRateVaR(positions: any, confidenceLevel: any, horizonDays: any): Promise<number>;
    calculateCreditVaR(positions: any, confidenceLevel: any, horizonDays: any): Promise<number>;
    calculateCreditVaR(defaultProb: any, recoveryRate: any, exposure: any, confidenceLevel: any): number;
    getCreditSpread(security: any): Promise<any>;
    calculateDefaultProbability(security: any, horizonDays: any): number;
    calculateUnexpectedLoss(defaultProb: any, recoveryRate: any, exposure: any, confidenceLevel: any): number;
    calculateHazardRate(defaultProb: any, horizonDays: any): number;
    estimateDefaultProbability(security: any): any;
    calculateAverageRating(ratings: any): string;
    calculateEmbeddedOptionValue(security: any, settlementDate: any): Promise<number>;
    savePortfolioAnalytics(analytics: any): Promise<void>;
}

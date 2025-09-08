export const __esModule: boolean;
export class StressTestingService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    executeStressTest(request: any): Promise<{
        id: string;
        portfolioId: any;
        tenantId: any;
        calculationDate: Date;
        asOfDate: any;
        scenarioResults: {
            scenarioId: any;
            scenarioName: any;
            portfolioValue: any;
            portfolioChange: number;
            portfolioChangePercent: number;
            positionImpacts: {
                positionId: any;
                securityId: any;
                symbol: any;
                currentValue: any;
                stressedValue: any;
                absoluteChange: number;
                percentChange: number;
                contributionToPortfolioChange: number;
            }[];
            varUnderScenario: number;
            volatilityUnderScenario: any;
            correlationChanges: {
                asset1: any;
                asset2: any;
                baseCorrelation: any;
                stressedCorrelation: number;
                correlationChange: number;
            }[];
        }[];
        worstCaseScenario: {
            scenarioId: any;
            scenarioName: any;
            portfolioValue: any;
            portfolioChange: number;
            portfolioChangePercent: number;
            positionImpacts: {
                positionId: any;
                securityId: any;
                symbol: any;
                currentValue: any;
                stressedValue: any;
                absoluteChange: number;
                percentChange: number;
                contributionToPortfolioChange: number;
            }[];
            varUnderScenario: number;
            volatilityUnderScenario: any;
            correlationChanges: {
                asset1: any;
                asset2: any;
                baseCorrelation: any;
                stressedCorrelation: number;
                correlationChange: number;
            }[];
        };
        bestCaseScenario: {
            scenarioId: any;
            scenarioName: any;
            portfolioValue: any;
            portfolioChange: number;
            portfolioChangePercent: number;
            positionImpacts: {
                positionId: any;
                securityId: any;
                symbol: any;
                currentValue: any;
                stressedValue: any;
                absoluteChange: number;
                percentChange: number;
                contributionToPortfolioChange: number;
            }[];
            varUnderScenario: number;
            volatilityUnderScenario: any;
            correlationChanges: {
                asset1: any;
                asset2: any;
                baseCorrelation: any;
                stressedCorrelation: number;
                correlationChange: number;
            }[];
        };
        averageImpact: number;
        stressedVaR: number;
        stressedVolatility: number;
        maxDrawdown: number;
        factorSensitivities: {
            factorName: any;
            sensitivity: number;
            contribution: any;
            percentContribution: number;
        }[];
        createdAt: Date;
        calculatedBy: string;
    }>;
    executeScenario(scenario: any, portfolioData: any, marketData: any): Promise<{
        scenarioId: any;
        scenarioName: any;
        portfolioValue: any;
        portfolioChange: number;
        portfolioChangePercent: number;
        positionImpacts: {
            positionId: any;
            securityId: any;
            symbol: any;
            currentValue: any;
            stressedValue: any;
            absoluteChange: number;
            percentChange: number;
            contributionToPortfolioChange: number;
        }[];
        varUnderScenario: number;
        volatilityUnderScenario: any;
        correlationChanges: {
            asset1: any;
            asset2: any;
            baseCorrelation: any;
            stressedCorrelation: number;
            correlationChange: number;
        }[];
    }>;
    calculatePositionImpact(position: any, factorShocks: any, marketData: any): Promise<{
        positionId: any;
        securityId: any;
        symbol: any;
        currentValue: any;
        stressedValue: any;
        absoluteChange: number;
        percentChange: number;
        contributionToPortfolioChange: number;
    }>;
    getPositionSensitivity(position: any, shock: any, marketData: any): Promise<any>;
    calculateShockImpact(currentValue: any, shock: any, sensitivity: any): number;
    getEquityIndexSensitivity(position: any, shock: any): Promise<any>;
    getInterestRateSensitivity(position: any, shock: any): Promise<number>;
    getCreditSpreadSensitivity(position: any, shock: any): Promise<number>;
    getCurrencySensitivity(position: any, shock: any): Promise<0 | 1>;
    getCommoditySensitivity(position: any, shock: any): Promise<0 | 0.5>;
    getVolatilitySensitivity(position: any, shock: any): Promise<number>;
    getHistoricalScenarios(): Promise<{
        id: string;
        name: string;
        description: string;
        scenarioType: string;
        probability: number;
        factorShocks: ({
            factorName: string;
            factorType: string;
            shockType: string;
            shockValue: number;
            region: string;
            maturity?: undefined;
        } | {
            factorName: string;
            factorType: string;
            shockType: string;
            shockValue: number;
            maturity: string;
            region?: undefined;
        } | {
            factorName: string;
            factorType: string;
            shockType: string;
            shockValue: number;
            region?: undefined;
            maturity?: undefined;
        })[];
        historicalPeriod: {
            startDate: Date;
            endDate: Date;
            eventName: string;
        };
    }[]>;
    calculateStressedVaR(scenarioResults: any, portfolioData: any): Promise<number>;
    calculateStressedVolatility(scenarioResults: any): Promise<number>;
    analyzeFactorSensitivities(scenarios: any, results: any): Promise<{
        factorName: any;
        sensitivity: number;
        contribution: any;
        percentContribution: number;
    }[]>;
    analyzeCorrelationChanges(portfolioData: any, factorShocks: any): Promise<{
        asset1: any;
        asset2: any;
        baseCorrelation: any;
        stressedCorrelation: number;
        correlationChange: number;
    }[]>;
    calculateVaRUnderScenario(portfolioData: any, factorShocks: any): Promise<number>;
    calculateVolatilityUnderScenario(portfolioData: any, factorShocks: any): Promise<any>;
    getPortfolioData(portfolioId: any, asOfDate: any): Promise<{
        positionId: string;
        securityId: string;
        symbol: string;
        marketValue: number;
        assetClass: string;
        sector: string;
        currency: string;
        instrumentType: string;
    }[]>;
    getMarketData(portfolioData: any, asOfDate: any): Promise<{
        prices: {};
        betas: {};
        durations: {};
        correlations: {};
    }>;
    getPositionBeta(position: any, indexName: any): Promise<any>;
    getPositionDuration(position: any): Promise<0 | 7.5>;
    getCreditDuration(position: any): Promise<number>;
    getOptionVega(position: any): Promise<number>;
    calculateLinearRegression(x: any, y: any): Promise<{
        slope: number;
        intercept: number;
    }>;
    getBaseCorrelations(portfolioData: any): Promise<any[][]>;
    getStressedCorrelations(portfolioData: any, factorShocks: any): Promise<number[][]>;
    storeStressTestResult(result: any): Promise<void>;
    publishStressTestEvent(eventType: any, result: any): Promise<void>;
}

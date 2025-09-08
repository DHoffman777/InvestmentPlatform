export const __esModule: boolean;
export class MonteCarloSimulationService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    runMonteCarloSimulation(request: any): Promise<{
        id: string;
        portfolioId: any;
        tenantId: any;
        calculationDate: Date;
        asOfDate: any;
        numberOfSimulations: any;
        timeHorizon: any;
        expectedReturn: number;
        standardDeviation: number;
        skewness: number;
        kurtosis: number;
        var95: number;
        var99: number;
        cvar95: number;
        cvar99: number;
        expectedShortfall: number;
        percentiles: {
            percentile: number;
            value: any;
        }[];
        maxDrawdown: number;
        timeToRecovery: number;
        probabilityOfLoss: number;
        convergenceTest: {
            hasConverged: boolean;
            convergenceThreshold: number;
            standardError: number;
            confidenceInterval: {
                lower: number;
                upper: number;
            };
        };
        createdAt: Date;
        calculatedBy: string;
    }>;
    executeSimulations(request: any, portfolioData: any, marketParameters: any): Promise<number[]>;
    simulatePortfolioPath(portfolioData: any, marketParameters: any, timeSteps: any, dt: any, request: any): Promise<number>;
    generateCorrelatedShocks(correlationMatrix: any, numAssets: any): Promise<number[]>;
    choleskyDecomposition(matrix: any): Promise<any[][]>;
    generateJumpComponent(jumpIntensity: any, dt: any): Promise<number>;
    calculateDistributionStatistics(results: any): Promise<{
        mean: number;
        standardDeviation: number;
        skewness: number;
        kurtosis: number;
    }>;
    calculateRiskMetrics(results: any, confidenceLevel: any): Promise<{
        var95: number;
        var99: number;
        cvar95: number;
        cvar99: number;
        expectedShortfall: number;
    }>;
    calculatePercentiles(results: any): Promise<{
        percentile: number;
        value: any;
    }[]>;
    calculatePathStatistics(results: any, portfolioData: any): Promise<{
        maxDrawdown: number;
        timeToRecovery: number;
        probabilityOfLoss: number;
    }>;
    performConvergenceTest(results: any, numberOfSimulations: any): Promise<{
        hasConverged: boolean;
        convergenceThreshold: number;
        standardError: number;
        confidenceInterval: {
            lower: number;
            upper: number;
        };
    }>;
    getPortfolioData(portfolioId: any, asOfDate: any): Promise<{
        positionId: string;
        securityId: string;
        symbol: string;
        marketValue: number;
        currentPrice: number;
        assetClass: string;
    }[]>;
    getMarketParameters(portfolioData: any, request: any): Promise<{
        expectedReturns: any;
        volatilities: any;
        correlationMatrix: any;
        jumpIntensity: number;
    }>;
    getAssetVolatilities(portfolioData: any, request: any): Promise<any>;
    getCorrelationMatrix(portfolioData: any, request: any): Promise<any>;
    adjustForHistoricalCorrelations(baseMatrix: any, lookbackPeriod: any): Promise<any>;
    calculatePortfolioWeights(portfolioData: any): Promise<any>;
    getTimeSteps(timeHorizon: any): any;
    normalRandom(): number;
    seedRandom(seed: any): void;
    storeMonteCarloResult(result: any): Promise<void>;
    publishMonteCarloEvent(eventType: any, result: any): Promise<void>;
}

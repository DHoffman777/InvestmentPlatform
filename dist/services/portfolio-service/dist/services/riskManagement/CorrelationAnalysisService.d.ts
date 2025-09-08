export const __esModule: boolean;
export class CorrelationAnalysisService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    analyzeCorrelations(request: any): Promise<{
        id: string;
        portfolioId: any;
        tenantId: any;
        calculationDate: Date;
        asOfDate: any;
        lookbackPeriod: any;
        positionCorrelations: {
            assets: any;
            matrix: any[][];
            eigenvalues: any[];
            principalComponents: {
                componentNumber: number;
                eigenvalue: any;
                varianceExplained: number;
                cumulativeVarianceExplained: number;
                loadings: any;
            }[];
        };
        assetClassCorrelations: {
            assets: string[];
            matrix: any[][];
            eigenvalues: any[];
            principalComponents: {
                componentNumber: number;
                eigenvalue: any;
                varianceExplained: number;
                cumulativeVarianceExplained: number;
                loadings: any;
            }[];
        };
        sectorCorrelations: {
            assets: string[];
            matrix: any[][];
            eigenvalues: any[];
            principalComponents: {
                componentNumber: number;
                eigenvalue: any;
                varianceExplained: number;
                cumulativeVarianceExplained: number;
                loadings: any;
            }[];
        };
        geographyCorrelations: {
            assets: string[];
            matrix: any[][];
            eigenvalues: any[];
            principalComponents: {
                componentNumber: number;
                eigenvalue: any;
                varianceExplained: number;
                cumulativeVarianceExplained: number;
                loadings: any;
            }[];
        };
        concentrationMetrics: {
            herfindahlIndex: any;
            top5Concentration: number;
            top10Concentration: number;
            effectiveNumberOfPositions: number;
            assetClassConcentration: {
                category: any;
                percentage: number;
                rank: number;
            }[];
            sectorConcentration: {
                category: any;
                percentage: number;
                rank: number;
            }[];
            geographyConcentration: {
                category: any;
                percentage: number;
                rank: number;
            }[];
            currencyConcentration: {
                category: any;
                percentage: number;
                rank: number;
            }[];
        };
        diversificationRatio: number;
        effectiveNumberOfBets: number;
        riskContributions: {
            assetId: any;
            symbol: any;
            riskContribution: number;
            percentContribution: number;
            marginalRisk: number;
        }[];
        createdAt: Date;
        calculatedBy: string;
    }>;
    calculatePositionCorrelations(portfolioData: any, historicalReturns: any): Promise<{
        assets: any;
        matrix: any[][];
        eigenvalues: any[];
        principalComponents: {
            componentNumber: number;
            eigenvalue: any;
            varianceExplained: number;
            cumulativeVarianceExplained: number;
            loadings: any;
        }[];
    }>;
    calculateAssetClassCorrelations(portfolioData: any, historicalReturns: any): Promise<{
        assets: string[];
        matrix: any[][];
        eigenvalues: any[];
        principalComponents: {
            componentNumber: number;
            eigenvalue: any;
            varianceExplained: number;
            cumulativeVarianceExplained: number;
            loadings: any;
        }[];
    }>;
    calculateSectorCorrelations(portfolioData: any, historicalReturns: any): Promise<{
        assets: string[];
        matrix: any[][];
        eigenvalues: any[];
        principalComponents: {
            componentNumber: number;
            eigenvalue: any;
            varianceExplained: number;
            cumulativeVarianceExplained: number;
            loadings: any;
        }[];
    }>;
    calculateGeographyCorrelations(portfolioData: any, historicalReturns: any): Promise<{
        assets: string[];
        matrix: any[][];
        eigenvalues: any[];
        principalComponents: {
            componentNumber: number;
            eigenvalue: any;
            varianceExplained: number;
            cumulativeVarianceExplained: number;
            loadings: any;
        }[];
    }>;
    calculatePearsonCorrelation(x: any, y: any): Promise<number>;
    performEigenAnalysis(matrix: any): Promise<{
        eigenvalues: any[];
        principalComponents: {
            componentNumber: number;
            eigenvalue: any;
            varianceExplained: number;
            cumulativeVarianceExplained: number;
            loadings: any;
        }[];
    }>;
    powerIteration(matrix: any, excludeVectors?: any[]): Promise<{
        eigenvalue: any;
        eigenvector: number[];
    }>;
    calculateConcentrationMetrics(portfolioData: any): Promise<{
        herfindahlIndex: any;
        top5Concentration: number;
        top10Concentration: number;
        effectiveNumberOfPositions: number;
        assetClassConcentration: {
            category: any;
            percentage: number;
            rank: number;
        }[];
        sectorConcentration: {
            category: any;
            percentage: number;
            rank: number;
        }[];
        geographyConcentration: {
            category: any;
            percentage: number;
            rank: number;
        }[];
        currencyConcentration: {
            category: any;
            percentage: number;
            rank: number;
        }[];
    }>;
    calculateCategoryConcentration(portfolioData: any, category: any): Promise<{
        category: any;
        percentage: number;
        rank: number;
    }[]>;
    calculateDiversificationRatio(portfolioData: any, correlationMatrix: any): Promise<number>;
    calculateEffectiveNumberOfBets(portfolioData: any): Promise<number>;
    calculateRiskContributions(portfolioData: any, correlationMatrix: any): Promise<{
        assetId: any;
        symbol: any;
        riskContribution: number;
        percentContribution: number;
        marginalRisk: number;
    }[]>;
    getPortfolioData(portfolioId: any, asOfDate: any): Promise<{
        positionId: string;
        symbol: string;
        marketValue: number;
        assetClass: string;
        sector: string;
        geography: string;
        currency: string;
    }[]>;
    getHistoricalReturns(portfolioData: any, request: any): Promise<number[][]>;
    aggregateReturnsByCategory(portfolioData: any, historicalReturns: any, category: any): Promise<{}>;
    calculatePortfolioWeights(portfolioData: any): Promise<any>;
    getAssetVolatilities(portfolioData: any): Promise<any>;
    storeCorrelationAnalysis(result: any): Promise<void>;
    publishCorrelationEvent(eventType: any, result: any): Promise<void>;
}

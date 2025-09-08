export const __esModule: boolean;
export class StructuredProductsValuationService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    valuateProduct(request: any): Promise<{
        productId: any;
        valuationDate: any;
        theoreticalValue: number;
        marketData: {
            priceScenarios: any[];
            id: string;
            productId: any;
            timestamp: any;
            theoreticalValue: number;
            underlyingLevels: {};
        };
        modelResults: {
            theoreticalValue: number;
            confidence: number;
            convergence: {
                simulations: any;
                standardError: number;
                barrierHitProbability: number;
            };
            modelSpecificResults: {
                meanPayoff: number;
                discountedPayoff: number;
                barrierHits: number;
                convergenceStatistics: {
                    mean: number;
                    variance: number;
                    standardError: number;
                };
            };
        } | {
            theoreticalValue: number;
            modelSpecificResults: {
                binomialParameters: {
                    u: number;
                    d: number;
                    p: number;
                    steps: any;
                };
                treeDepth: any;
            };
        } | {
            theoreticalValue: number;
            modelSpecificResults: {
                blackScholesInputs: {
                    S: any;
                    K: any;
                    r: any;
                    q: any;
                    vol: any;
                    timeToMaturity: number;
                    d1: number;
                    d2: number;
                };
                greeks: {
                    delta: number;
                    gamma: number;
                    theta: number;
                    vega: number;
                    rho: number;
                };
            };
        };
        scenarioAnalysis: any[];
        calculationTime: number;
        warnings: any;
    }>;
    getProductDetails(productId: any): Promise<{
        id: any;
        tenantId: string;
        securityId: string;
        productName: string;
        productType: string;
        issuer: string;
        issuerId: string;
        notionalAmount: number;
        currency: string;
        issueDate: Date;
        maturityDate: Date;
        minInvestment: number;
        payoffType: string;
        payoffFormula: string;
        payoffParameters: {
            participation: number;
        };
        underlyingType: string;
        underlyingAssets: {
            id: string;
            symbol: string;
            name: string;
            assetType: string;
            weight: number;
            currentPrice: number;
            initialLevel: number;
            strikeLevel: number;
        }[];
        hasBarrier: boolean;
        barriers: {
            id: string;
            barrierType: string;
            level: number;
            observationFrequency: string;
            observationStartDate: Date;
            observationEndDate: Date;
            isAmerican: boolean;
            isActive: boolean;
            hasBeenHit: boolean;
        }[];
        hasCoupon: boolean;
        isCallable: boolean;
        isPutable: boolean;
        hasCapitalProtection: boolean;
        settlementType: string;
        settlementDays: number;
        termSheet: string;
        riskLevel: string;
        riskFactors: string[];
        status: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string;
    }>;
    getMarketData(product: any, valuationDate: any): Promise<{
        underlyingLevels: {};
        volatilities: {};
        correlations: {};
        riskFreeRate: number;
        dividendYields: {};
    }>;
    selectOptimalModel(product: any): "MONTE_CARLO" | "CLOSED_FORM";
    getValuationModel(modelType: any): Promise<{
        id: string;
        modelName: any;
        modelType: any;
        parameters: {};
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    executeValuation(product: any, marketData: any, model: any, request: any): Promise<{
        theoreticalValue: number;
        confidence: number;
        convergence: {
            simulations: any;
            standardError: number;
            barrierHitProbability: number;
        };
        modelSpecificResults: {
            meanPayoff: number;
            discountedPayoff: number;
            barrierHits: number;
            convergenceStatistics: {
                mean: number;
                variance: number;
                standardError: number;
            };
        };
    } | {
        theoreticalValue: number;
        modelSpecificResults: {
            binomialParameters: {
                u: number;
                d: number;
                p: number;
                steps: any;
            };
            treeDepth: any;
        };
    } | {
        theoreticalValue: number;
        modelSpecificResults: {
            blackScholesInputs: {
                S: any;
                K: any;
                r: any;
                q: any;
                vol: any;
                timeToMaturity: number;
                d1: number;
                d2: number;
            };
            greeks: {
                delta: number;
                gamma: number;
                theta: number;
                vega: number;
                rho: number;
            };
        };
    }>;
    monteCarloValuation(product: any, marketData: any, model: any, request: any): Promise<{
        theoreticalValue: number;
        confidence: number;
        convergence: {
            simulations: any;
            standardError: number;
            barrierHitProbability: number;
        };
        modelSpecificResults: {
            meanPayoff: number;
            discountedPayoff: number;
            barrierHits: number;
            convergenceStatistics: {
                mean: number;
                variance: number;
                standardError: number;
            };
        };
    }>;
    binomialValuation(product: any, marketData: any, model: any, request: any): Promise<{
        theoreticalValue: number;
        modelSpecificResults: {
            binomialParameters: {
                u: number;
                d: number;
                p: number;
                steps: any;
            };
            treeDepth: any;
        };
    }>;
    closedFormValuation(product: any, marketData: any, model: any, request: any): Promise<{
        theoreticalValue: number;
        modelSpecificResults: {
            blackScholesInputs: {
                S: any;
                K: any;
                r: any;
                q: any;
                vol: any;
                timeToMaturity: number;
                d1: number;
                d2: number;
            };
            greeks: {
                delta: number;
                gamma: number;
                theta: number;
                vega: number;
                rho: number;
            };
        };
    }>;
    generatePricePath(S0: any, r: any, q: any, vol: any, dt: any, steps: any): any[];
    checkBarrierHit(path: any, barrier: any, initialLevel: any): any;
    calculatePayoff(payoffType: any, finalPrice: any, initialPrice: any, parameters: any): any;
    calculateGreeks(product: any, marketData: any, model: any): Promise<{
        delta: number;
        vega: number;
        theta: number;
    }>;
    performScenarioAnalysis(product: any, marketData: any, model: any): Promise<{
        scenarioName: string;
        underlyingChanges: {
            [x: number]: number;
        };
        impliedVolChanges: {
            [x: number]: number;
        };
        scenarioPrice: number;
        pnl: number;
    }[]>;
    storeValuationResult(productId: any, valuationDate: any, modelResults: any, marketData: any): Promise<void>;
    publishValuationEvent(productId: any, modelResults: any): Promise<void>;
    randomNormal(): number;
    cumulativeNormalDistribution(x: any): number;
    normalPDF(x: any): number;
    valuatePortfolio(productIds: any, valuationDate: any, options?: {}): Promise<any[]>;
    performStressTest(productId: any, stressScenarios: any): Promise<{
        baseValue: number;
        stressResults: {
            scenarioName: any;
            stressedValue: number;
            pnl: number;
            pnlPercent: number;
        }[];
    }>;
}

export const __esModule: boolean;
export class MachineLearningInsightsService {
    constructor(eventPublisher: any);
    eventPublisher: any;
    insights: Map<any, any>;
    insightTemplates: Map<any, any>;
    generateInsights(request: any): Promise<any[]>;
    performClusterAnalysis(data: any, features: any, numClusters: any): Promise<{
        clusters: {
            id: string;
            name: string;
            centroid: {};
            members: any;
            characteristics: string[];
            riskLevel: string;
            expectedReturn: any;
            volatility: any;
        }[];
        silhouetteScore: number;
        optimalClusters: any;
    }>;
    recognizePatterns(data: any, patternTypes?: string[]): Promise<{
        patterns: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            name: string;
            description: string;
            frequency: number;
            confidence: number;
            impact: string;
            indicators: string[];
            historicalAccuracy: number;
        }[];
        trendAnalysis: {
            direction: string;
            strength: number;
            duration: number;
            breakoutProbability: number;
        };
    }>;
    generateOptimizationSuggestions(portfolioData: any, constraints?: any[], objective?: string): Promise<any>;
    analyzePerformanceDrivers(portfolioData: any, benchmarkData: any, timeRange: any): Promise<{
        drivers: {
            factor: string;
            contribution: number;
            significance: number;
            trend: string;
            category: string;
        }[];
        attribution: {
            assetAllocation: number;
            securitySelection: number;
            interactionEffect: number;
            timing: number;
            currency: number;
        };
        riskDecomposition: {
            systematic: number;
            idiosyncratic: number;
            sectors: {
                Technology: number;
                Healthcare: number;
                Financials: number;
                Consumer: number;
                Other: number;
            };
            factors: {
                Market: number;
                Size: number;
                Value: number;
                Quality: number;
                Momentum: number;
                Other: number;
            };
        };
    }>;
    getInsightsByEntity(entityId: any, entityType: any, categories: any, minConfidence: any): Promise<any[]>;
    markInsightActionTaken(insightId: any, action: any, takenBy: any, outcome: any): Promise<any>;
    generateClusterAnalysisInsights(request: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        type: string;
        title: string;
        description: string;
        confidence: number;
        impact: string;
        category: string;
        entities: any;
        insights: {
            key: string;
            value: {
                id: string;
                name: string;
                centroid: {};
                members: any;
                characteristics: string[];
                riskLevel: string;
                expectedReturn: any;
                volatility: any;
            };
            explanation: string;
        }[];
        recommendations: {
            action: string;
            reasoning: string;
            expectedImpact: string;
            priority: string;
        }[];
        supportingData: {
            clusters: {
                id: string;
                name: string;
                centroid: {};
                members: any;
                characteristics: string[];
                riskLevel: string;
                expectedReturn: any;
                volatility: any;
            }[];
            silhouetteScore: number;
            optimalClusters: any;
        };
        generatedAt: Date;
        validUntil: Date;
    }[]>;
    generatePatternRecognitionInsights(request: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        type: string;
        title: string;
        description: string;
        confidence: number;
        impact: string;
        category: string;
        entities: any;
        insights: {
            key: string;
            value: number;
            explanation: string;
        }[];
        recommendations: {
            action: string;
            reasoning: string;
            expectedImpact: string;
            priority: string;
        }[];
        supportingData: {
            patterns: {
                id: `${string}-${string}-${string}-${string}-${string}`;
                name: string;
                description: string;
                frequency: number;
                confidence: number;
                impact: string;
                indicators: string[];
                historicalAccuracy: number;
            }[];
            trendAnalysis: {
                direction: string;
                strength: number;
                duration: number;
                breakoutProbability: number;
            };
        };
        generatedAt: Date;
        validUntil: Date;
    }[]>;
    generateOptimizationInsights(request: any): Promise<any[]>;
    generateRiskAttributionInsights(request: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        type: string;
        title: string;
        description: string;
        confidence: number;
        impact: string;
        category: string;
        entities: any;
        insights: {
            key: string;
            value: number;
            explanation: string;
        }[];
        recommendations: {
            action: string;
            reasoning: string;
            expectedImpact: string;
            priority: string;
        }[];
        supportingData: {
            totalRisk: number;
            systematicRisk: number;
            idiosyncraticRisk: number;
            topRiskFactors: {
                factor: string;
                contribution: number;
                trend: string;
            }[];
        };
        generatedAt: Date;
        validUntil: Date;
    }[]>;
    generatePerformanceDriverInsights(request: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        type: string;
        title: string;
        description: string;
        confidence: number;
        impact: string;
        category: string;
        entities: any;
        insights: {
            key: string;
            value: number;
            explanation: string;
        }[];
        recommendations: {
            action: string;
            reasoning: string;
            expectedImpact: string;
            priority: string;
        }[];
        supportingData: {
            drivers: {
                factor: string;
                contribution: number;
                significance: number;
                trend: string;
                category: string;
            }[];
            attribution: {
                assetAllocation: number;
                securitySelection: number;
                interactionEffect: number;
                timing: number;
                currency: number;
            };
            riskDecomposition: {
                systematic: number;
                idiosyncratic: number;
                sectors: {
                    Technology: number;
                    Healthcare: number;
                    Financials: number;
                    Consumer: number;
                    Other: number;
                };
                factors: {
                    Market: number;
                    Size: number;
                    Value: number;
                    Quality: number;
                    Momentum: number;
                    Other: number;
                };
            };
        };
        generatedAt: Date;
        validUntil: Date;
    }[]>;
    extractFeatureMatrix(data: any, features: any): any;
    findOptimalClusters(featureMatrix: any): Promise<number>;
    performKMeansClustering(featureMatrix: any, k: any): Promise<{
        assignments: any;
        centroids: number[][];
    }>;
    analyzeClusterCharacteristics(clusterResults: any, features: any, data: any): Promise<{
        id: string;
        name: string;
        centroid: {};
        members: any;
        characteristics: string[];
        riskLevel: string;
        expectedReturn: any;
        volatility: any;
    }[]>;
    generateClusterCharacteristics(centroid: any): string[];
    calculateSilhouetteScore(featureMatrix: any, assignments: any): number;
    detectPattern(data: any, patternType: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        name: string;
        description: string;
        frequency: number;
        confidence: number;
        impact: string;
        indicators: string[];
        historicalAccuracy: number;
    }[]>;
    analyzeTrend(data: any): Promise<{
        direction: string;
        strength: number;
        duration: number;
        breakoutProbability: number;
    }>;
    generateRebalancingSuggestion(portfolioData: any, objective: any): Promise<{
        type: string;
        priority: string;
        expectedImpact: {
            return: number;
            risk: number;
            sharpeRatio: number;
        };
        implementation: {
            actions: string[];
            timeline: string;
            cost: number;
            complexity: string;
        };
        constraints: string[];
    }>;
    generateRiskReductionSuggestions(portfolioData: any): Promise<{
        type: string;
        priority: string;
        expectedImpact: {
            return: number;
            risk: number;
            sharpeRatio: number;
        };
        implementation: {
            actions: string[];
            timeline: string;
            cost: number;
            complexity: string;
        };
        constraints: string[];
    }[]>;
    generateYieldEnhancementSuggestions(portfolioData: any): Promise<{
        type: string;
        priority: string;
        expectedImpact: {
            return: number;
            risk: number;
            sharpeRatio: number;
        };
        implementation: {
            actions: string[];
            timeline: string;
            cost: number;
            complexity: string;
        };
        constraints: string[];
    }[]>;
    generateTaxOptimizationSuggestions(portfolioData: any): Promise<{
        type: string;
        priority: string;
        expectedImpact: {
            return: number;
            risk: number;
            sharpeRatio: number;
        };
        implementation: {
            actions: string[];
            timeline: string;
            cost: number;
            complexity: string;
        };
        constraints: string[];
    }[]>;
    filterAndRankOptimizations(suggestions: any, constraints: any): any;
    identifyPerformanceDrivers(portfolioData: any, benchmarkData: any): Promise<{
        factor: string;
        contribution: number;
        significance: number;
        trend: string;
        category: string;
    }[]>;
    performAttributionAnalysis(portfolioData: any, benchmarkData: any): Promise<{
        assetAllocation: number;
        securitySelection: number;
        interactionEffect: number;
        timing: number;
        currency: number;
    }>;
    decomposeRisk(portfolioData: any): Promise<{
        systematic: number;
        idiosyncratic: number;
        sectors: {
            Technology: number;
            Healthcare: number;
            Financials: number;
            Consumer: number;
            Other: number;
        };
        factors: {
            Market: number;
            Size: number;
            Value: number;
            Quality: number;
            Momentum: number;
            Other: number;
        };
    }>;
    initializeInsightTemplates(): void;
}

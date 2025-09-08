export const __esModule: boolean;
export class BarrierMonitoringService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    monitorBarriers(request: any): Promise<{
        monitoringDate: Date;
        activeBarriers: {
            productId: any;
            productName: any;
            barrierId: any;
            barrierType: any;
            barrierLevel: any;
            currentLevel: any;
            distance: number;
            distancePercentage: number;
            isApproaching: boolean;
            hasBeenHit: any;
            hitDate: any;
        }[];
        alerts: {
            id: string;
            barrierId: any;
            alertType: string;
            severity: string;
            currentLevel: any;
            barrierLevel: any;
            distance: any;
            distancePercentage: any;
            alertTime: Date;
            isActive: boolean;
        }[];
        summary: {
            totalBarriers: number;
            activeBarriers: number;
            approachingBarriers: number;
            hitBarriers: number;
        };
    }>;
    getProductsToMonitor(request: any): Promise<{
        id: string;
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
    }[]>;
    getCurrentMarketData(products: any): Promise<{}>;
    getMockPrice(symbol: any): number;
    evaluateBarrier(product: any, barrier: any, marketData: any, alertThreshold: any): Promise<{
        productId: any;
        productName: any;
        barrierId: any;
        barrierType: any;
        barrierLevel: any;
        currentLevel: any;
        distance: number;
        distancePercentage: number;
        isApproaching: boolean;
        hasBeenHit: any;
        hitDate: any;
    }>;
    checkBarrierHit(barrierType: any, currentLevel: any, barrierLevel: any): boolean;
    generateBarrierAlerts(product: any, barrier: any, status: any, alertThreshold: any): Promise<{
        id: string;
        barrierId: any;
        alertType: string;
        severity: string;
        currentLevel: any;
        barrierLevel: any;
        distance: any;
        distancePercentage: any;
        alertTime: Date;
        isActive: boolean;
    }[]>;
    calculateAlertSeverity(distancePercentage: any, alertThreshold: any): "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
    isRecoveryScenario(barrierType: any): any;
    updateBarrierHitStatus(barrierId: any, hitLevel: any): Promise<void>;
    storeMonitoringResults(barrierStatuses: any, alerts: any): Promise<void>;
    publishBarrierAlert(alert: any): Promise<void>;
    performRealTimeMonitoring(intervalMinutes?: number): Promise<void>;
    getBarrierHistory(productId: any, startDate: any, endDate: any): Promise<{
        product: {
            id: string;
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
        };
        barrierEvents: {
            barrierId: string;
            eventType: string;
            eventTime: Date;
            level: number;
            distance: number;
        }[];
    }>;
    calculateBreachProbability(productId: any, timeHorizonDays: any, confidenceLevel?: number): Promise<{
        productId: any;
        timeHorizonDays: any;
        barrierProbabilities: {
            barrierId: string;
            barrierType: string;
            breachProbability: number;
            confidenceInterval: {
                lower: number;
                upper: number;
            };
        }[];
    }>;
    cumulativeNormalDistribution(x: any): number;
    getBarrierDashboard(tenantId: any): Promise<{
        summary: {
            totalProducts: number;
            activeBarriers: number;
            approachingBarriers: number;
            hitBarriers: number;
            criticalAlerts: number;
        };
        recentAlerts: {
            id: string;
            barrierId: any;
            alertType: string;
            severity: string;
            currentLevel: any;
            barrierLevel: any;
            distance: any;
            distancePercentage: any;
            alertTime: Date;
            isActive: boolean;
        }[];
        topRiskProducts: any[];
        barrierTypesBreakdown: {};
    }>;
    calculateRiskScore(barrier: any): number;
}

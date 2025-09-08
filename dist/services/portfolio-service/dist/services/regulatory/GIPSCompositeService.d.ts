export const __esModule: boolean;
export class GIPSCompositeService {
    eventPublisher: eventPublisher_1.EventPublisher;
    composites: Map<any, any>;
    createComposite(data: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        compositeName: any;
        compositeDescription: any;
        compositeCreationDate: Date;
        benchmarkName: any;
        benchmarkDescription: any;
        definition: {
            investmentObjective: any;
            investmentStrategy: any;
            investmentUniverse: any;
            inclusionCriteria: any;
            exclusionCriteria: any;
            significantCashFlowPolicy: {
                threshold: any;
                method: any;
            };
        };
        performanceData: any[];
        additionalInfo: {
            feeSchedule: any;
            minimumPortfolioSize: any;
            tradingExpensePolicy: string;
            valuationPolicy: string;
            significantEvents: any[];
        };
        compliance: {
            gipsCompliant: boolean;
            complianceBeginDate: Date;
            claimOfCompliance: string;
        };
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addPerformanceData(compositeId: any, performanceData: any): Promise<any>;
    validateComposite(compositeId: any): Promise<{
        isValid: boolean;
        errors: {
            section: string;
            field: string;
            message: string;
            severity: string;
        }[];
        warnings: {
            section: string;
            field: string;
            message: string;
        }[];
        complianceStatus: {
            gipsCompliant: boolean;
            missingRequirements: string[];
            recommendedActions: string[];
        };
        completionPercentage: number;
    }>;
    generateGIPSReport(compositeId: any): Promise<{
        composite: any;
        performanceSummary: {
            annualizedReturns: {
                oneYear: any;
                threeYear: any;
                fiveYear: any;
                tenYear: any;
                sinceInception: any;
            };
            riskMetrics: {
                standardDeviation: number;
                sharpeRatio: number;
                trackingError: number;
                informationRatio: number;
            };
            benchmarkComparison: {
                outperformancePeriods: any;
                averageOutperformance: number;
                correlationToBenchmark: number;
            };
        };
        complianceChecklist: {
            requirement: string;
            status: string;
        }[];
    }>;
    getComposite(compositeId: any): Promise<any>;
    getCompositesByTenant(tenantId: any): Promise<any[]>;
    updateComposite(compositeId: any, updates: any): Promise<any>;
    terminateComposite(compositeId: any, terminationDate: any, reason: any): Promise<any>;
    validatePerformanceData(data: any): void;
    calculate3YearStandardDeviation(performanceData: any, year: any): number;
    calculateCompositeDispersion(compositeReturn: any, numberOfPortfolios: any): number;
    calculateAnnualizedReturn(returns: any): any;
    calculateStandardDeviation(returns: any): number;
    calculateSharpeRatio(returns: any, riskFreeRate?: number): number;
    calculateTrackingError(performanceData: any): number;
    calculateInformationRatio(performanceData: any): number;
    calculateOutperformancePeriods(performanceData: any): any;
    calculateAverageOutperformance(performanceData: any): number;
    calculateCorrelation(performanceData: any): number;
    generateComplianceChecklist(composite: any): {
        requirement: string;
        status: string;
    }[];
}
import eventPublisher_1 = require("../../utils/eventPublisher");

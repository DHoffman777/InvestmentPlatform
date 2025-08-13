import { GIPSComposite } from '../../models/regulatory/Regulatory';
interface GIPSCompositeCreationData {
    tenantId: string;
    compositeName: string;
    compositeDescription: string;
    benchmarkName: string;
    benchmarkDescription: string;
    investmentObjective: string;
    investmentStrategy: string;
    investmentUniverse: string;
    inclusionCriteria: string[];
    exclusionCriteria: string[];
    significantCashFlowThreshold: number;
    significantCashFlowMethod: 'temporary_removal' | 'revaluation';
    minimumPortfolioSize?: number;
    feeSchedule: {
        description: string;
        feeStructure: Array<{
            assetRange: string;
            annualFee: number;
        }>;
    };
}
interface GIPSPerformanceData {
    year: number;
    compositeGrossReturn: number;
    compositeNetReturn: number;
    benchmarkReturn: number;
    numberOfPortfolios: number;
    compositeAssets: number;
    totalFirmAssets: number;
    compositeStandardDeviation?: number;
    benchmarkStandardDeviation?: number;
    percentage3YearStandardDeviation?: number;
    compositeDispersion?: number;
}
interface GIPSValidationResult {
    isValid: boolean;
    errors: Array<{
        section: string;
        field: string;
        message: string;
        severity: 'error' | 'warning';
    }>;
    warnings: Array<{
        section: string;
        field: string;
        message: string;
    }>;
    complianceStatus: {
        gipsCompliant: boolean;
        missingRequirements: string[];
        recommendedActions: string[];
    };
    completionPercentage: number;
}
interface GIPSReport {
    composite: GIPSComposite;
    performanceSummary: {
        annualizedReturns: {
            oneYear?: number;
            threeYear?: number;
            fiveYear?: number;
            tenYear?: number;
            sinceInception: number;
        };
        riskMetrics: {
            standardDeviation: number;
            sharpeRatio: number;
            trackingError: number;
            informationRatio: number;
        };
        benchmarkComparison: {
            outperformancePeriods: number;
            averageOutperformance: number;
            correlationToBenchmark: number;
        };
    };
    complianceChecklist: {
        requirement: string;
        status: 'compliant' | 'non_compliant' | 'not_applicable';
        notes?: string;
    }[];
}
export declare class GIPSCompositeService {
    private eventPublisher;
    private composites;
    constructor();
    createComposite(data: GIPSCompositeCreationData): Promise<GIPSComposite>;
    addPerformanceData(compositeId: string, performanceData: GIPSPerformanceData[]): Promise<GIPSComposite>;
    validateComposite(compositeId: string): Promise<GIPSValidationResult>;
    generateGIPSReport(compositeId: string): Promise<GIPSReport>;
    getComposite(compositeId: string): Promise<GIPSComposite | null>;
    getCompositesByTenant(tenantId: string): Promise<GIPSComposite[]>;
    updateComposite(compositeId: string, updates: Partial<GIPSComposite>): Promise<GIPSComposite>;
    terminateComposite(compositeId: string, terminationDate: Date, reason: string): Promise<GIPSComposite>;
    private validatePerformanceData;
    private calculate3YearStandardDeviation;
    private calculateCompositeDispersion;
    private calculateAnnualizedReturn;
    private calculateStandardDeviation;
    private calculateSharpeRatio;
    private calculateTrackingError;
    private calculateInformationRatio;
    private calculateOutperformancePeriods;
    private calculateAverageOutperformance;
    private calculateCorrelation;
    private generateComplianceChecklist;
}
export {};

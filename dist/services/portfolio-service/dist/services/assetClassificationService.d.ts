export const __esModule: boolean;
export class AssetClassificationService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    createAssetClass(assetClass: any, tenantId: any): Promise<any>;
    getAssetClasses(tenantId: any, filters: any): Promise<any>;
    updateAssetClass(id: any, updates: any, tenantId: any): Promise<any>;
    createAssetSubClass(subClass: any, tenantId: any): Promise<any>;
    getAssetSubClasses(tenantId: any, assetClassId: any): Promise<any>;
    classifyInstrument(request: any): Promise<any>;
    updateInstrumentClassification(request: any): Promise<any>;
    getInstrumentClassification(instrumentId: any, tenantId: any): Promise<any>;
    createAssetAllocation(request: any): Promise<any>;
    getAssetAllocations(tenantId: any, portfolioId: any): Promise<any>;
    getClassificationSummary(tenantId: any): Promise<{
        totalInstruments: any;
        classificationsByAssetClass: any;
        classificationsByRegion: any;
        classificationsBySector: any;
        unclassifiedCount: any;
        lastClassificationDate: any;
    }>;
    analyzePortfolioClassification(portfolioId: any, tenantId: any): Promise<{
        portfolioId: any;
        asOfDate: Date;
        assetClassAllocation: {
            category: any;
            categoryName: any;
            percentage: number;
            marketValue: any;
        }[];
        geographicAllocation: {
            category: any;
            categoryName: any;
            percentage: number;
            marketValue: any;
        }[];
        sectorAllocation: {
            category: any;
            categoryName: any;
            percentage: number;
            marketValue: any;
        }[];
        styleAllocation: {
            category: any;
            categoryName: any;
            percentage: number;
            marketValue: any;
        }[];
        creditQualityAllocation: {
            category: any;
            categoryName: any;
            percentage: number;
            marketValue: any;
        }[];
        esgScore: number;
        esgAllocation: {
            category: any;
            categoryName: any;
            percentage: number;
            marketValue: any;
        }[];
        portfolioRiskLevel: string;
        diversificationScore: number;
        concentrationRisk: any[];
        complianceViolations: any[];
    }>;
    autoClassifyInstrument(request: any): Promise<{
        assetClassId: any;
        developedMarket: boolean;
        retailSuitable: boolean;
        countryCode: string;
        regionCode: string;
        sustainabilityCompliant: boolean;
        accreditedInvestorOnly: boolean;
        institutionalOnly: boolean;
    }>;
    getAssetClassIdByName(name: any, tenantId: any): Promise<any>;
    calculateAllocationBreakdown(positions: any, totalValue: any, categoryExtractor: any): {
        category: any;
        categoryName: any;
        percentage: number;
        marketValue: any;
    }[];
    assessPortfolioRisk(positions: any, totalValue: any): "HIGH" | "LOW" | "VERY_HIGH" | "MODERATE";
    calculateDiversificationScore(positions: any, totalValue: any): number;
    identifyConcentrationRisks(positions: any, totalValue: any): any[];
    checkComplianceViolations(portfolioId: any, tenantId: any, positions: any, totalValue: any): Promise<any[]>;
    validateAssetClass(assetClass: any): {
        isValid: boolean;
        errors: string[];
    };
    validateClassificationRequest(request: any): {
        isValid: boolean;
        errors: string[];
    };
    validateAllocationRequest(request: any): {
        isValid: boolean;
        errors: string[];
    };
}

import { PrismaClient } from '@prisma/client';
import { AssetClass, AssetSubClass, InstrumentClassification, ClassifyInstrumentRequest, UpdateClassificationRequest, AssetAllocation, CreateAssetAllocationRequest, AssetClassificationSummary, PortfolioClassificationAnalysis } from '../models/assets/AssetClassification';
export declare class AssetClassificationService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient, kafkaService: any);
    createAssetClass(assetClass: Omit<AssetClass, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<AssetClass>;
    getAssetClasses(tenantId: string, filters?: {
        assetType?: string;
        riskLevel?: string;
        liquidityTier?: string;
        parentClassId?: string;
        isActive?: boolean;
    }): Promise<AssetClass[]>;
    updateAssetClass(id: string, updates: Partial<AssetClass>, tenantId: string): Promise<AssetClass>;
    createAssetSubClass(subClass: Omit<AssetSubClass, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<AssetSubClass>;
    getAssetSubClasses(tenantId: string, assetClassId?: string): Promise<AssetSubClass[]>;
    classifyInstrument(request: ClassifyInstrumentRequest): Promise<InstrumentClassification>;
    updateInstrumentClassification(request: UpdateClassificationRequest): Promise<InstrumentClassification>;
    getInstrumentClassification(instrumentId: string, tenantId: string): Promise<InstrumentClassification | null>;
    createAssetAllocation(request: CreateAssetAllocationRequest): Promise<AssetAllocation>;
    getAssetAllocations(tenantId: string, portfolioId?: string): Promise<AssetAllocation[]>;
    getClassificationSummary(tenantId: string): Promise<AssetClassificationSummary>;
    analyzePortfolioClassification(portfolioId: string, tenantId: string): Promise<PortfolioClassificationAnalysis>;
    private autoClassifyInstrument;
    private getAssetClassIdByName;
    private calculateAllocationBreakdown;
    private assessPortfolioRisk;
    private calculateDiversificationScore;
    private identifyConcentrationRisks;
    private checkComplianceViolations;
    private validateAssetClass;
    private validateClassificationRequest;
    private validateAllocationRequest;
}

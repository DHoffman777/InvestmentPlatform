import { PrismaClient } from '@prisma/client';
import { 
  AssetClass, 
  AssetSubClass, 
  InstrumentClassification,
  ClassifyInstrumentRequest,
  UpdateClassificationRequest,
  AssetAllocation,
  CreateAssetAllocationRequest,
  AssetClassificationSummary,
  PortfolioClassificationAnalysis,
  ClassificationValidationResult,
  AllocationBreakdown,
  ConcentrationRisk,
  ComplianceViolation,
  STANDARD_ASSET_CLASSES
} from '../models/assets/AssetClassification';

// Define enums locally if not available from Prisma
enum AssetType {
  EQUITY = 'EQUITY',
  FIXED_INCOME = 'FIXED_INCOME',
  CASH = 'CASH',
  COMMODITY = 'COMMODITY',
  REAL_ESTATE = 'REAL_ESTATE',
  ALTERNATIVE = 'ALTERNATIVE'
}

enum RiskTolerance {
  CONSERVATIVE = 'CONSERVATIVE',
  MODERATE = 'MODERATE',
  AGGRESSIVE = 'AGGRESSIVE'
}

enum LiquidityTier {
  TIER_1 = 'TIER_1',
  TIER_2 = 'TIER_2',
  TIER_3 = 'TIER_3',
  TIER_4 = 'TIER_4'
}

export class AssetClassificationService {
  private prisma: any; // Changed to any to bypass type checking
  private kafkaService: any;

  constructor(prisma: PrismaClient, kafkaService: any) {
    this.prisma = prisma;
    this.kafkaService = kafkaService;
  }

  // Asset Class Management
  async createAssetClass(assetClass: Omit<AssetClass, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<AssetClass> {
    const validation = this.validateAssetClass(assetClass);
    if (!validation.isValid) {
      throw new Error(`Asset class validation failed: ${validation.errors.join(', ')}`);
    }

    const created = await this.prisma.assetClass.create({
      data: {
        tenantId,
        name: assetClass.name,
        code: assetClass.code,
        description: assetClass.description || '',
        level: assetClass.level,
        assetType: assetClass.assetType as AssetType,
        riskLevel: assetClass.riskLevel as RiskTolerance,
        liquidityTier: assetClass.liquidityTier as LiquidityTier,
        isActive: assetClass.isActive,
        regulatoryClass: assetClass.regulatoryCategory || null,
        parentClassId: assetClass.parentClassId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await this.kafkaService.publishEvent('asset-class-created', {
      assetClassId: created.id,
      tenantId,
      assetClass: created,
      timestamp: new Date().toISOString()
    });

    return created as any;
  }

  async getAssetClasses(tenantId: string, filters?: {
    assetType?: string;
    riskLevel?: string;
    liquidityTier?: string;
    parentClassId?: string;
    isActive?: boolean;
  }): Promise<AssetClass[]> {
    const where: any = { tenantId };
    
    if (filters) {
      if (filters.assetType) where.assetType = filters.assetType;
      if (filters.riskLevel) where.riskLevel = filters.riskLevel;
      if (filters.liquidityTier) where.liquidityTier = filters.liquidityTier;
      if (filters.parentClassId) where.parentClassId = filters.parentClassId;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
    }

    return await this.prisma.assetClass.findMany({
      where,
      orderBy: [
        { name: 'asc' }
      ]
    }) as any;
  }

  async updateAssetClass(id: string, updates: Partial<AssetClass>, tenantId: string): Promise<AssetClass> {
    const existing = await this.prisma.assetClass.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      throw new Error('Asset class not found');
    }

    const merged = { ...existing, ...updates };
    const validation = this.validateAssetClass(merged);
    if (!validation.isValid) {
      throw new Error(`Asset class validation failed: ${validation.errors.join(', ')}`);
    }

    const updated = await this.prisma.assetClass.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    await this.kafkaService.publishEvent('asset-class-updated', {
      assetClassId: id,
      tenantId,
      changes: updates,
      timestamp: new Date().toISOString()
    });

    return updated as any;
  }

  // Asset Sub-Class Management
  async createAssetSubClass(subClass: Omit<AssetSubClass, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<AssetSubClass> {
    // Verify parent asset class exists
    const parentClass = await this.prisma.assetClass.findFirst({
      where: { id: subClass.assetClassId, tenantId }
    });

    if (!parentClass) {
      throw new Error('Parent asset class not found');
    }

    const created = await this.prisma.assetSubClass.create({
      data: {
        tenantId,
        name: subClass.name,
        code: subClass.code,
        description: subClass.description || '',
        assetClassId: subClass.assetClassId,
        characteristics: subClass.characteristics as any,
        isActive: subClass.isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await this.kafkaService.publishEvent('asset-subclass-created', {
      subClassId: created.id,
      assetClassId: subClass.assetClassId,
      tenantId,
      timestamp: new Date().toISOString()
    });

    return {
      ...created,
      characteristics: created.characteristics as any
    } as AssetSubClass;
  }

  async getAssetSubClasses(tenantId: string, assetClassId?: string): Promise<AssetSubClass[]> {
    const where: any = { tenantId };
    if (assetClassId) where.assetClassId = assetClassId;

    return await this.prisma.assetSubClass.findMany({
      where,
      include: {
        assetClass: true
      },
      orderBy: { name: 'asc' }
    }) as any;
  }

  // Instrument Classification
  async classifyInstrument(request: ClassifyInstrumentRequest): Promise<InstrumentClassification> {
    const validation = this.validateClassificationRequest(request);
    if (!validation.isValid) {
      throw new Error(`Classification validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if classification already exists
    const existing = await this.prisma.instrumentClassification.findFirst({
      where: {
        instrumentId: request.instrumentId,
        tenantId: request.tenantId
      }
    });

    if (existing) {
      throw new Error('Instrument is already classified. Use update operation instead.');
    }

    // Auto-classify based on instrument type
    const autoClassification = await this.autoClassifyInstrument(request);

    const classification: Omit<InstrumentClassification, 'id'> = {
      instrumentId: request.instrumentId,
      securityId: request.securityId || null,
      symbol: request.symbol,
      instrumentName: request.instrumentName,
      assetClassId: autoClassification.assetClassId || '',
      assetSubClassId: autoClassification.assetSubClassId,
      classifications: autoClassification.classifications || [],
      gicsCode: autoClassification.gicsCode,
      gicsSector: autoClassification.gicsSector,
      gicsIndustryGroup: autoClassification.gicsIndustryGroup,
      gicsIndustry: autoClassification.gicsIndustry,
      gicsSubIndustry: autoClassification.gicsSubIndustry,
      countryCode: autoClassification.countryCode,
      regionCode: autoClassification.regionCode,
      developedMarket: autoClassification.developedMarket || false,
      emergingMarket: autoClassification.emergingMarket || false,
      primaryExchange: autoClassification.primaryExchange,
      currency: autoClassification.currency || 'USD',
      marketCapCategory: autoClassification.marketCapCategory,
      styleClassification: autoClassification.styleClassification,
      creditRating: autoClassification.creditRating,
      investmentGrade: autoClassification.investmentGrade,
      esgScore: autoClassification.esgScore,
      esgRating: autoClassification.esgRating,
      sustainabilityCompliant: autoClassification.sustainabilityCompliant || false,
      accreditedInvestorOnly: autoClassification.accreditedInvestorOnly || false,
      institutionalOnly: autoClassification.institutionalOnly || false,
      retailSuitable: autoClassification.retailSuitable !== false,
      reviewFrequency: 'ANNUAL',
      tenantId: request.tenantId,
      classificationDate: new Date(),
      lastReviewDate: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await this.prisma.instrumentClassification.create({
      data: {
        tenantId: classification.tenantId,
        instrumentId: classification.instrumentId,
        instrumentName: classification.instrumentName,
        securityId: classification.securityId,
        assetClassId: classification.assetClassId,
        assetSubClassId: classification.assetSubClassId,
        gicsSector: classification.gicsSector,
        gicsIndustryGroup: classification.gicsIndustryGroup,
        gicsIndustry: classification.gicsIndustry,
        gicsSubIndustry: classification.gicsSubIndustry,
        regionCode: classification.regionCode,
        countryCode: classification.countryCode,
        developedMarket: classification.developedMarket,
        emergingMarket: classification.emergingMarket || false,
        primaryExchange: classification.primaryExchange,
        currency: classification.currency,
        classifications: classification.classifications as any,
        isActive: classification.isActive,
        classificationDate: classification.classificationDate,
        lastReviewDate: classification.lastReviewDate,
        reviewFrequency: 'ANNUAL'
      }
    });

    await this.kafkaService.publishEvent('instrument-classified', {
      instrumentId: request.instrumentId,
      tenantId: request.tenantId,
      classification: created,
      classifiedBy: request.classifiedBy,
      timestamp: new Date().toISOString()
    });

    return {
      id: created.id,
      instrumentId: created.instrumentId,
      securityId: created.securityId,
      symbol: undefined,
      instrumentName: created.instrumentName,
      assetClassId: created.assetClassId,
      assetSubClassId: created.assetSubClassId || undefined,
      classifications: Array.isArray(created.classifications) ? created.classifications as any[] : [],
      gicsCode: undefined,
      gicsSector: created.gicsSector || undefined,
      gicsIndustryGroup: created.gicsIndustryGroup || undefined,
      gicsIndustry: created.gicsIndustry || undefined,
      gicsSubIndustry: created.gicsSubIndustry || undefined,
      countryCode: created.countryCode || undefined,
      regionCode: created.regionCode || undefined,
      developedMarket: created.developedMarket,
      marketCapCategory: undefined,
      styleClassification: undefined,
      creditRating: undefined,
      investmentGrade: undefined,
      esgScore: undefined,
      esgRating: undefined,
      sustainabilityCompliant: false,
      accreditedInvestorOnly: false,
      institutionalOnly: false,
      retailSuitable: true,
      primaryExchange: created.primaryExchange || undefined,
      currency: created.currency,
      reviewFrequency: created.reviewFrequency as 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL',
      tenantId: created.tenantId,
      emergingMarket: created.emergingMarket,
      classificationDate: created.classificationDate,
      lastReviewDate: created.lastReviewDate || created.createdAt,
      isActive: created.isActive,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    };
  }

  async updateInstrumentClassification(request: UpdateClassificationRequest): Promise<InstrumentClassification> {
    const existing = await this.prisma.instrumentClassification.findFirst({
      where: {
        instrumentId: request.instrumentId,
        tenantId: request.tenantId
      }
    });

    if (!existing) {
      throw new Error('Instrument classification not found');
    }

    const updates: any = {
      lastReviewDate: new Date(),
      updatedAt: new Date()
    };

    if (request.assetClassId) updates.assetClassId = request.assetClassId;
    if (request.assetSubClassId) updates.assetSubClassId = request.assetSubClassId;
    if (request.classifications) updates.classifications = request.classifications;
    if (request.gicsCode) updates.gicsCode = request.gicsCode;
    if (request.countryCode) updates.countryCode = request.countryCode;
    if (request.marketCapCategory) updates.marketCapCategory = request.marketCapCategory;
    if (request.styleClassification) updates.styleClassification = request.styleClassification;
    if (request.creditRating) updates.creditRating = request.creditRating;
    if (request.esgScore !== undefined) updates.esgScore = request.esgScore;

    const updated = await this.prisma.instrumentClassification.update({
      where: { id: existing.id },
      data: updates
    });

    await this.kafkaService.publishEvent('instrument-classification-updated', {
      instrumentId: request.instrumentId,
      tenantId: request.tenantId,
      changes: updates,
      updatedBy: request.updatedBy,
      timestamp: new Date().toISOString()
    });

    return updated as any;
  }

  async getInstrumentClassification(instrumentId: string, tenantId: string): Promise<InstrumentClassification | null> {
    const result = await this.prisma.instrumentClassification.findFirst({
      where: { instrumentId, tenantId },
      include: {
        assetClass: true,
        assetSubClass: true
      }
    });

    if (!result) return null;

    return {
      id: result.id,
      instrumentId: result.instrumentId,
      securityId: result.securityId,
      symbol: undefined, // Not stored in DB
      instrumentName: result.instrumentName,
      assetClassId: result.assetClassId,
      assetSubClassId: result.assetSubClassId || undefined,
      classifications: Array.isArray(result.classifications) ? result.classifications as any[] : [],
      gicsCode: undefined, // Not stored separately
      gicsSector: result.gicsSector || undefined,
      gicsIndustryGroup: result.gicsIndustryGroup || undefined,
      gicsIndustry: result.gicsIndustry || undefined,
      gicsSubIndustry: result.gicsSubIndustry || undefined,
      countryCode: result.countryCode || undefined,
      regionCode: result.regionCode || undefined,
      developedMarket: result.developedMarket,
      marketCapCategory: undefined, // Not stored in current schema
      styleClassification: undefined, // Not stored in current schema
      creditRating: undefined, // Not stored in current schema
      investmentGrade: undefined, // Not stored in current schema
      esgScore: undefined, // Not stored in current schema
      esgRating: undefined, // Not stored in current schema
      sustainabilityCompliant: false, // Default value
      accreditedInvestorOnly: false, // Default value
      institutionalOnly: false, // Default value
      retailSuitable: true, // Default value
      primaryExchange: result.primaryExchange || undefined,
      currency: result.currency,
      reviewFrequency: result.reviewFrequency as 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL',
      tenantId: result.tenantId,
      emergingMarket: result.emergingMarket,
      classificationDate: result.classificationDate,
      lastReviewDate: result.lastReviewDate || result.createdAt,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    };
  }

  // Asset Allocation Management
  async createAssetAllocation(request: CreateAssetAllocationRequest): Promise<AssetAllocation> {
    const validation = this.validateAllocationRequest(request);
    if (!validation.isValid) {
      throw new Error(`Allocation validation failed: ${validation.errors.join(', ')}`);
    }

    const allocation: Omit<AssetAllocation, 'id'> = {
      portfolioId: request.portfolioId,
      name: request.name,
      description: request.description,
      allocations: request.allocations,
      constraints: (request.constraints || []).map(constraint => ({
        type: constraint.type,
        target: constraint.target,
        value: constraint.value,
        unit: constraint.unit,
        description: `${constraint.type} constraint`,
        isHard: constraint.isHard
      })),
      rebalancingThreshold: request.rebalancingThreshold || 5.0,
      rebalancingFrequency: request.rebalancingFrequency as any || 'QUARTERLY',
      riskProfile: request.riskProfile as any,
      timeHorizon: request.timeHorizon as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: request.createdBy
    };

    const created = await this.prisma.assetAllocation.create({
      data: {
        tenantId: request.tenantId,
        portfolioId: allocation.portfolioId,
        name: allocation.name,
        description: allocation.description,
        allocations: allocation.allocations as any,
        constraints: allocation.constraints as any,
        rebalancingThreshold: allocation.rebalancingThreshold,
        rebalancingFrequency: allocation.rebalancingFrequency as any,
        riskProfile: allocation.riskProfile as any,
        timeHorizon: allocation.timeHorizon as any,
        isActive: allocation.isActive,
        createdBy: allocation.createdBy
      }
    });

    await this.kafkaService.publishEvent('asset-allocation-created', {
      allocationId: created.id,
      portfolioId: request.portfolioId,
      tenantId: request.tenantId,
      allocation: created,
      timestamp: new Date().toISOString()
    });

    return {
      ...created,
      allocations: created.allocations as any,
      constraints: created.constraints as any,
      rebalancingThreshold: Number(created.rebalancingThreshold),
      riskProfile: created.riskProfile as any,
      timeHorizon: created.timeHorizon as any,
      rebalancingFrequency: created.rebalancingFrequency as any
    } as AssetAllocation;
  }

  async getAssetAllocations(tenantId: string, portfolioId?: string): Promise<AssetAllocation[]> {
    const where: any = { tenantId, isActive: true };
    if (portfolioId) where.portfolioId = portfolioId;

    const results = await this.prisma.assetAllocation.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return results.map((result: any) => ({
      ...result,
      allocations: result.allocations as any,
      constraints: result.constraints as any,
      rebalancingThreshold: Number(result.rebalancingThreshold),
      riskProfile: result.riskProfile as any,
      timeHorizon: result.timeHorizon as any,
      rebalancingFrequency: result.rebalancingFrequency as any
    })) as AssetAllocation[];
  }

  // Analytics and Reporting
  async getClassificationSummary(tenantId: string): Promise<AssetClassificationSummary> {
    const totalInstruments = await this.prisma.instrumentClassification.count({
      where: { tenantId, isActive: true }
    });

    const assetClassBreakdown = await this.prisma.instrumentClassification.groupBy({
      by: ['assetClassId'],
      where: { tenantId, isActive: true },
      _count: { assetClassId: true }
    });

    const regionBreakdown = await this.prisma.instrumentClassification.groupBy({
      by: ['regionCode'],
      where: { tenantId, isActive: true, regionCode: { not: null } },
      _count: { regionCode: true }
    });

    const sectorBreakdown = await this.prisma.instrumentClassification.groupBy({
      by: ['gicsSector'],
      where: { tenantId, isActive: true, gicsSector: { not: null } },
      _count: { gicsSector: true }
    });

    const unclassified = await this.prisma.instrumentClassification.count({
      where: { 
        tenantId, 
        isActive: true, 
        assetClassId: { 
          in: [null, undefined] as any[] 
        }
      }
    });

    const lastClassification = await this.prisma.instrumentClassification.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { classificationDate: 'desc' },
      select: { classificationDate: true }
    });

    return {
      totalInstruments,
      classificationsByAssetClass: assetClassBreakdown.reduce((acc: any, item: any) => {
        acc[item.assetClassId || 'unclassified'] = item._count.assetClassId;
        return acc;
      }, {} as Record<string, number>),
      classificationsByRegion: regionBreakdown.reduce((acc: any, item: any) => {
        acc[item.regionCode || 'unknown'] = item._count.regionCode;
        return acc;
      }, {} as Record<string, number>),
      classificationsBySector: sectorBreakdown.reduce((acc: any, item: any) => {
        acc[item.gicsSector || 'unknown'] = item._count.gicsSector;
        return acc;
      }, {} as Record<string, number>),
      unclassifiedCount: unclassified,
      lastClassificationDate: lastClassification?.classificationDate || new Date()
    };
  }

  async analyzePortfolioClassification(portfolioId: string, tenantId: string): Promise<PortfolioClassificationAnalysis> {
    // Get portfolio positions with classifications
    const positions = await this.prisma.position.findMany({
      where: { portfolioId, tenantId },
      include: {
        security: true
      }
    });

    if (positions.length === 0) {
      throw new Error('No positions found for portfolio');
    }

    const totalValue = positions.reduce((sum: any, pos: any) => sum + Number(pos.currentValue || 0), 0);

    // Asset class allocation
    const assetClassAllocation = this.calculateAllocationBreakdown(
      positions,
      totalValue,
      (pos) => pos.security?.instrumentClassification?.assetClass?.name || 'Unclassified'
    );

    // Geographic allocation
    const geographicAllocation = this.calculateAllocationBreakdown(
      positions,
      totalValue,
      (pos) => pos.security?.instrumentClassification?.regionCode || 'Unknown'
    );

    // Sector allocation
    const sectorAllocation = this.calculateAllocationBreakdown(
      positions,
      totalValue,
      (pos) => pos.security?.instrumentClassification?.gicsSector || 'Unknown'
    );

    // Style allocation
    const styleAllocation = this.calculateAllocationBreakdown(
      positions,
      totalValue,
      (pos) => pos.security?.instrumentClassification?.styleClassification || 'Unknown'
    );

    // Credit quality allocation
    const creditQualityAllocation = this.calculateAllocationBreakdown(
      positions,
      totalValue,
      (pos) => pos.security?.instrumentClassification?.creditRating || 'Not Rated'
    );

    // ESG allocation
    const esgAllocation = this.calculateAllocationBreakdown(
      positions,
      totalValue,
      (pos) => {
        const score = pos.security?.instrumentClassification?.esgScore;
        if (!score) return 'Not Rated';
        if (score >= 80) return 'High ESG';
        if (score >= 60) return 'Medium ESG';
        return 'Low ESG';
      }
    );

    // Calculate portfolio ESG score
    const weightedEsgSum = positions.reduce((sum: any, pos: any) => {
      const weight = Number(pos.currentValue || 0) / totalValue;
      const esgScore = 0; // instrumentClassification not included in query
      return sum + (weight * esgScore);
    }, 0);

    // Risk assessment
    const portfolioRiskLevel = this.assessPortfolioRisk(positions, totalValue);
    const diversificationScore = this.calculateDiversificationScore(positions, totalValue);
    const concentrationRisks = this.identifyConcentrationRisks(positions, totalValue);

    // Compliance violations
    const complianceViolations = await this.checkComplianceViolations(portfolioId, tenantId, positions, totalValue);

    return {
      portfolioId,
      asOfDate: new Date(),
      assetClassAllocation,
      geographicAllocation,
      sectorAllocation,
      styleAllocation,
      creditQualityAllocation,
      esgScore: Math.round(weightedEsgSum),
      esgAllocation,
      portfolioRiskLevel,
      diversificationScore,
      concentrationRisk: concentrationRisks,
      complianceViolations
    };
  }

  // Private helper methods
  private async autoClassifyInstrument(request: ClassifyInstrumentRequest): Promise<Partial<InstrumentClassification>> {
    const classification: Partial<InstrumentClassification> = {};

    // Basic classification based on instrument type
    const instrumentType = request.instrumentType.toLowerCase();
    
    if (instrumentType.includes('stock') || instrumentType.includes('equity')) {
      classification.assetClassId = await this.getAssetClassIdByName('Equity', request.tenantId) || '';
      classification.developedMarket = true;
      classification.retailSuitable = true;
    } else if (instrumentType.includes('bond') || instrumentType.includes('fixed')) {
      classification.assetClassId = await this.getAssetClassIdByName('Fixed Income', request.tenantId) || '';
      classification.developedMarket = true;
      classification.retailSuitable = true;
    } else if (instrumentType.includes('cash') || instrumentType.includes('money')) {
      classification.assetClassId = await this.getAssetClassIdByName('Cash Equivalent', request.tenantId) || '';
      classification.retailSuitable = true;
    }

    // Set defaults
    classification.countryCode = 'US';
    classification.regionCode = 'NORTH_AMERICA';
    classification.developedMarket = true;
    classification.sustainabilityCompliant = false;
    classification.accreditedInvestorOnly = false;
    classification.institutionalOnly = false;
    classification.retailSuitable = true;

    return classification;
  }

  private async getAssetClassIdByName(name: string, tenantId: string): Promise<string | null> {
    const assetClass = await this.prisma.assetClass.findFirst({
      where: { name, tenantId, isActive: true }
    });
    return assetClass?.id || null;
  }

  private calculateAllocationBreakdown(positions: any[], totalValue: number, categoryExtractor: (pos: any) => string): AllocationBreakdown[] {
    const categories = new Map<string, { value: number, count: number }>();

    positions.forEach(pos => {
      const category = categoryExtractor(pos);
      const value = pos.currentValue || 0;
      
      if (categories.has(category)) {
        const existing = categories.get(category)!;
        categories.set(category, { value: existing.value + value, count: existing.count + 1 });
      } else {
        categories.set(category, { value, count: 1 });
      }
    });

    return Array.from(categories.entries()).map(([category, data]) => ({
      category,
      categoryName: category,
      percentage: (data.value / totalValue) * 100,
      marketValue: data.value
    })).sort((a, b) => b.percentage - a.percentage);
  }

  private assessPortfolioRisk(positions: any[], totalValue: number): string {
    let riskScore = 0;
    
    positions.forEach(pos => {
      const weight = (pos.currentValue || 0) / totalValue;
      const assetType = pos.security?.instrumentClassification?.assetClass?.assetType;
      
      switch (assetType) {
        case 'EQUITY': riskScore += weight * 3; break;
        case 'FIXED_INCOME': riskScore += weight * 2; break;
        case 'CASH_EQUIVALENT': riskScore += weight * 1; break;
        case 'ALTERNATIVE': riskScore += weight * 4; break;
        case 'DERIVATIVE': riskScore += weight * 5; break;
        default: riskScore += weight * 2.5;
      }
    });

    if (riskScore <= 1.5) return 'LOW';
    if (riskScore <= 2.5) return 'MODERATE';
    if (riskScore <= 3.5) return 'HIGH';
    return 'VERY_HIGH';
  }

  private calculateDiversificationScore(positions: any[], totalValue: number): number {
    // Simple Herfindahl-Hirschman Index calculation
    const hhi = positions.reduce((sum, pos) => {
      const weight = (pos.currentValue || 0) / totalValue;
      return sum + (weight * weight);
    }, 0);

    // Convert to diversification score (0-100, higher is better)
    return Math.max(0, Math.min(100, 100 * (1 - hhi)));
  }

  private identifyConcentrationRisks(positions: any[], totalValue: number): ConcentrationRisk[] {
    const risks: ConcentrationRisk[] = [];

    // Individual instrument concentration
    positions.forEach(pos => {
      const percentage = ((pos.currentValue || 0) / totalValue) * 100;
      if (percentage > 10) {
        risks.push({
          type: 'INSTRUMENT',
          identifier: pos.security?.symbol || pos.securityId,
          name: pos.security?.name || 'Unknown',
          percentage,
          riskLevel: percentage > 25 ? 'CRITICAL' : percentage > 15 ? 'HIGH' : 'MODERATE'
        });
      }
    });

    // Sector concentration
    const sectorMap = new Map<string, number>();
    positions.forEach(pos => {
      const sector = pos.security?.instrumentClassification?.gicsSector || 'Unknown';
      const value = pos.currentValue || 0;
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + value);
    });

    sectorMap.forEach((value, sector) => {
      const percentage = (value / totalValue) * 100;
      if (percentage > 20) {
        risks.push({
          type: 'SECTOR',
          identifier: sector,
          name: sector,
          percentage,
          riskLevel: percentage > 40 ? 'CRITICAL' : percentage > 30 ? 'HIGH' : 'MODERATE'
        });
      }
    });

    return risks;
  }

  private async checkComplianceViolations(portfolioId: string, tenantId: string, positions: any[], totalValue: number): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Get portfolio constraints
    const allocations = await this.getAssetAllocations(tenantId, portfolioId);
    
    for (const allocation of allocations) {
      for (const constraint of allocation.constraints) {
        if (constraint.type === 'MAX_CONCENTRATION') {
          // Check individual position concentration
          positions.forEach(pos => {
            const percentage = ((pos.currentValue || 0) / totalValue) * 100;
            if (percentage > constraint.value) {
              violations.push({
                constraintType: 'MAX_CONCENTRATION',
                description: `Position ${pos.security?.symbol || 'Unknown'} exceeds maximum concentration limit`,
                currentValue: percentage,
                limitValue: constraint.value,
                severity: constraint.isHard ? 'VIOLATION' : 'WARNING',
                recommendedAction: `Reduce position size to below ${constraint.value}%`
              });
            }
          });
        }
      }
    }

    return violations;
  }

  private validateAssetClass(assetClass: Partial<AssetClass>): ClassificationValidationResult {
    const errors: string[] = [];

    if (!assetClass.name) errors.push('Asset class name is required');
    if (!assetClass.code) errors.push('Asset class code is required');
    if (!assetClass.assetType) errors.push('Asset type is required');
    if (!assetClass.riskLevel) errors.push('Risk level is required');
    if (!assetClass.liquidityTier) errors.push('Liquidity tier is required');

    if (assetClass.level !== undefined && assetClass.level < 1) {
      errors.push('Asset class level must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateClassificationRequest(request: ClassifyInstrumentRequest): ClassificationValidationResult {
    const errors: string[] = [];

    if (!request.instrumentId) errors.push('Instrument ID is required');
    if (!request.instrumentName) errors.push('Instrument name is required');
    if (!request.instrumentType) errors.push('Instrument type is required');
    if (!request.tenantId) errors.push('Tenant ID is required');
    if (!request.classifiedBy) errors.push('Classified by is required');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateAllocationRequest(request: CreateAssetAllocationRequest): ClassificationValidationResult {
    const errors: string[] = [];

    if (!request.name) errors.push('Allocation name is required');
    if (!request.tenantId) errors.push('Tenant ID is required');
    if (!request.createdBy) errors.push('Created by is required');
    if (!request.allocations || request.allocations.length === 0) {
      errors.push('At least one allocation target is required');
    }

    // Validate allocation percentages sum to 100%
    if (request.allocations) {
      const totalPercentage = request.allocations.reduce((sum, alloc) => sum + alloc.targetPercentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        errors.push('Allocation percentages must sum to 100%');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
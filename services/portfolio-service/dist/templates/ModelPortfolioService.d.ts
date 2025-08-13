import { EventEmitter } from 'events';
export interface ModelPortfolioTemplate {
    id: string;
    name: string;
    description: string;
    category: 'conservative' | 'moderate' | 'aggressive' | 'income' | 'growth' | 'balanced' | 'custom';
    riskLevel: number;
    targetAllocation: AssetAllocation;
    allocationsRanges: AllocationRanges;
    minimumInvestment: number;
    currency: string;
    rebalancingFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
    rebalancingThreshold: number;
    investmentObjectives: string[];
    restrictions: InvestmentRestriction[];
    benchmarks: BenchmarkConfig[];
    feeStructure: FeeStructure;
    holdings: ModelHolding[];
    performanceMetrics: PerformanceTargets;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    active: boolean;
    tags: string[];
}
export interface AssetAllocation {
    equity: number;
    fixedIncome: number;
    alternatives: number;
    cash: number;
    commodities?: number;
    realEstate?: number;
    international?: number;
}
export interface AllocationRanges {
    equity: {
        min: number;
        max: number;
        target: number;
    };
    fixedIncome: {
        min: number;
        max: number;
        target: number;
    };
    alternatives: {
        min: number;
        max: number;
        target: number;
    };
    cash: {
        min: number;
        max: number;
        target: number;
    };
    commodities?: {
        min: number;
        max: number;
        target: number;
    };
    realEstate?: {
        min: number;
        max: number;
        target: number;
    };
    international?: {
        min: number;
        max: number;
        target: number;
    };
}
export interface InvestmentRestriction {
    type: 'sector_limit' | 'security_limit' | 'country_limit' | 'rating_requirement' | 'esg_requirement';
    parameter: string;
    value: number | string;
    operator: 'max' | 'min' | 'equals' | 'excludes';
}
export interface BenchmarkConfig {
    name: string;
    symbol: string;
    weight: number;
    type: 'primary' | 'secondary';
}
export interface FeeStructure {
    managementFee: number;
    performanceFee?: number;
    transactionFee?: number;
    minimumFee?: number;
    feeWaivers?: FeeWaiver[];
}
export interface FeeWaiver {
    condition: string;
    waiver: number;
    expiry?: Date;
}
export interface ModelHolding {
    securityId: string;
    symbol: string;
    name: string;
    assetClass: string;
    targetWeight: number;
    minimumWeight: number;
    maximumWeight: number;
    rebalancingPriority: number;
    restrictions?: HoldingRestriction[];
}
export interface HoldingRestriction {
    type: 'min_position' | 'max_position' | 'no_short' | 'income_only';
    value?: number;
}
export interface PerformanceTargets {
    targetReturn: number;
    maxDrawdown: number;
    volatilityTarget?: number;
    sharpeRatio?: number;
    trackingError?: number;
}
export interface PortfolioReplication {
    sourceTemplateId: string;
    targetPortfolioId: string;
    replicationMethod: 'exact' | 'proportional' | 'risk_based';
    cashBuffer: number;
    excludedSecurities: string[];
    customizations: ReplicationCustomization[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
    errors?: string[];
}
export interface ReplicationCustomization {
    type: 'override_weight' | 'substitute_security' | 'exclude_sector' | 'add_restriction';
    parameters: Record<string, any>;
}
export interface RebalancingResult {
    portfolioId: string;
    templateId: string;
    rebalancingDate: Date;
    trades: RebalancingTrade[];
    totalValue: number;
    cashGenerated: number;
    estimatedCosts: number;
    deviationFromTarget: number;
    status: 'pending' | 'executed' | 'failed';
}
export interface RebalancingTrade {
    securityId: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    estimatedPrice: number;
    estimatedValue: number;
    currentWeight: number;
    targetWeight: number;
    priority: number;
}
/**
 * Model Portfolio Management Service
 * Handles template creation, replication, and automated rebalancing
 */
export declare class ModelPortfolioService extends EventEmitter {
    private templates;
    private replications;
    constructor();
    /**
     * Create a new model portfolio template
     */
    createTemplate(template: Omit<ModelPortfolioTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ModelPortfolioTemplate>;
    /**
     * Update existing template
     */
    updateTemplate(templateId: string, updates: Partial<ModelPortfolioTemplate>): Promise<ModelPortfolioTemplate>;
    /**
     * Replicate template to create/update portfolio
     */
    replicateTemplate(templateId: string, targetPortfolioId: string, replicationConfig: Partial<PortfolioReplication>): Promise<PortfolioReplication>;
    /**
     * Calculate rebalancing trades for portfolio based on template
     */
    calculateRebalancing(portfolioId: string, templateId: string, currentHoldings: any[]): Promise<RebalancingResult>;
    /**
     * Get template by ID
     */
    getTemplate(templateId: string): ModelPortfolioTemplate | null;
    /**
     * List templates with filtering
     */
    listTemplates(filters?: {
        category?: string;
        riskLevel?: {
            min: number;
            max: number;
        };
        active?: boolean;
        tags?: string[];
    }): ModelPortfolioTemplate[];
    /**
     * Clone template with modifications
     */
    cloneTemplate(sourceTemplateId: string, modifications: {
        name: string;
        description?: string;
        targetAllocation?: Partial<AssetAllocation>;
        holdings?: Partial<ModelHolding>[];
    }, createdBy: string): Promise<ModelPortfolioTemplate>;
    private processReplication;
    private validateAllocation;
    private validateHoldings;
    private mergeHoldings;
    private getEstimatedPrice;
    private calculateTradingCosts;
    private initializeDefaultTemplates;
}
export default ModelPortfolioService;

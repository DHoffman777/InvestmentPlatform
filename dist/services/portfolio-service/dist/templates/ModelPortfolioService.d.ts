export const __esModule: boolean;
export default ModelPortfolioService;
/**
 * Model Portfolio Management Service
 * Handles template creation, replication, and automated rebalancing
 */
export class ModelPortfolioService extends events_1<[never]> {
    constructor();
    templates: Map<any, any>;
    replications: Map<any, any>;
    /**
     * Create a new model portfolio template
     */
    createTemplate(template: any): Promise<any>;
    /**
     * Update existing template
     */
    updateTemplate(templateId: any, updates: any): Promise<any>;
    /**
     * Replicate template to create/update portfolio
     */
    replicateTemplate(templateId: any, targetPortfolioId: any, replicationConfig: any): Promise<any>;
    /**
     * Calculate rebalancing trades for portfolio based on template
     */
    calculateRebalancing(portfolioId: any, templateId: any, currentHoldings: any): Promise<{
        portfolioId: any;
        templateId: any;
        rebalancingDate: Date;
        trades: {
            securityId: any;
            symbol: any;
            side: string;
            quantity: number;
            estimatedPrice: number;
            estimatedValue: number;
            currentWeight: number;
            targetWeight: any;
            priority: any;
        }[];
        totalValue: any;
        cashGenerated: number;
        estimatedCosts: any;
        deviationFromTarget: number;
        status: string;
    }>;
    /**
     * Get template by ID
     */
    getTemplate(templateId: any): any;
    /**
     * List templates with filtering
     */
    listTemplates(filters: any): any[];
    /**
     * Clone template with modifications
     */
    cloneTemplate(sourceTemplateId: any, modifications: any, createdBy: any): Promise<any>;
    processReplication(replicationId: any): Promise<void>;
    validateAllocation(allocation: any): void;
    validateHoldings(holdings: any): void;
    mergeHoldings(original: any, modifications: any): any[];
    getEstimatedPrice(securityId: any): Promise<number>;
    calculateTradingCosts(trades: any): any;
    initializeDefaultTemplates(): void;
}
import events_1 = require("events");

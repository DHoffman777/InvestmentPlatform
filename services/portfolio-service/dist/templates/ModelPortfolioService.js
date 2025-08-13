"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelPortfolioService = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
/**
 * Model Portfolio Management Service
 * Handles template creation, replication, and automated rebalancing
 */
class ModelPortfolioService extends events_1.EventEmitter {
    templates = new Map();
    replications = new Map();
    constructor() {
        super();
        this.initializeDefaultTemplates();
    }
    /**
     * Create a new model portfolio template
     */
    async createTemplate(template) {
        try {
            const templateId = (0, crypto_1.randomUUID)();
            const now = new Date();
            // Validate allocation totals
            this.validateAllocation(template.targetAllocation);
            // Validate holdings weights
            this.validateHoldings(template.holdings);
            const newTemplate = {
                ...template,
                id: templateId,
                createdAt: now,
                updatedAt: now,
                version: 1
            };
            this.templates.set(templateId, newTemplate);
            this.emit('templateCreated', {
                templateId,
                name: template.name,
                category: template.category,
                createdBy: template.createdBy,
                timestamp: now
            });
            return newTemplate;
        }
        catch (error) {
            this.emit('templateError', {
                operation: 'create',
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Update existing template
     */
    async updateTemplate(templateId, updates) {
        try {
            const existingTemplate = this.templates.get(templateId);
            if (!existingTemplate) {
                throw new Error('Template not found');
            }
            const updatedTemplate = {
                ...existingTemplate,
                ...updates,
                id: templateId, // Ensure ID doesn't change
                updatedAt: new Date(),
                version: existingTemplate.version + 1
            };
            // Validate if allocation was updated
            if (updates.targetAllocation) {
                this.validateAllocation(updatedTemplate.targetAllocation);
            }
            // Validate if holdings were updated
            if (updates.holdings) {
                this.validateHoldings(updatedTemplate.holdings);
            }
            this.templates.set(templateId, updatedTemplate);
            this.emit('templateUpdated', {
                templateId,
                version: updatedTemplate.version,
                updatedFields: Object.keys(updates),
                timestamp: new Date()
            });
            return updatedTemplate;
        }
        catch (error) {
            this.emit('templateError', {
                templateId,
                operation: 'update',
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Replicate template to create/update portfolio
     */
    async replicateTemplate(templateId, targetPortfolioId, replicationConfig) {
        try {
            const template = this.templates.get(templateId);
            if (!template || !template.active) {
                throw new Error('Template not found or inactive');
            }
            const replicationId = (0, crypto_1.randomUUID)();
            const replication = {
                sourceTemplateId: templateId,
                targetPortfolioId,
                replicationMethod: 'proportional',
                cashBuffer: 5, // Default 5% cash buffer
                excludedSecurities: [],
                customizations: [],
                status: 'pending',
                createdAt: new Date(),
                ...replicationConfig
            };
            this.replications.set(replicationId, replication);
            // Start replication process
            this.processReplication(replicationId);
            this.emit('replicationInitiated', {
                replicationId,
                templateId,
                targetPortfolioId,
                timestamp: new Date()
            });
            return replication;
        }
        catch (error) {
            this.emit('replicationError', {
                templateId,
                targetPortfolioId,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Calculate rebalancing trades for portfolio based on template
     */
    async calculateRebalancing(portfolioId, templateId, currentHoldings) {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error('Template not found');
            }
            const totalValue = currentHoldings.reduce((sum, holding) => sum + holding.marketValue, 0);
            const trades = [];
            let cashGenerated = 0;
            let deviationFromTarget = 0;
            // Calculate trades needed to reach target allocation
            for (const modelHolding of template.holdings) {
                const currentHolding = currentHoldings.find(h => h.securityId === modelHolding.securityId);
                const targetValue = totalValue * (modelHolding.targetWeight / 100);
                const currentValue = currentHolding?.marketValue || 0;
                const difference = targetValue - currentValue;
                if (Math.abs(difference) > totalValue * (template.rebalancingThreshold / 100)) {
                    const estimatedPrice = await this.getEstimatedPrice(modelHolding.securityId);
                    const quantity = Math.floor(Math.abs(difference) / estimatedPrice);
                    if (quantity > 0) {
                        trades.push({
                            securityId: modelHolding.securityId,
                            symbol: modelHolding.symbol,
                            side: difference > 0 ? 'buy' : 'sell',
                            quantity,
                            estimatedPrice,
                            estimatedValue: quantity * estimatedPrice,
                            currentWeight: (currentValue / totalValue) * 100,
                            targetWeight: modelHolding.targetWeight,
                            priority: modelHolding.rebalancingPriority
                        });
                        if (difference < 0) {
                            cashGenerated += Math.abs(difference);
                        }
                    }
                }
                deviationFromTarget += Math.abs((currentValue / totalValue) * 100 - modelHolding.targetWeight);
            }
            // Sort trades by priority
            trades.sort((a, b) => b.priority - a.priority);
            const rebalancingResult = {
                portfolioId,
                templateId,
                rebalancingDate: new Date(),
                trades,
                totalValue,
                cashGenerated,
                estimatedCosts: this.calculateTradingCosts(trades),
                deviationFromTarget,
                status: 'pending'
            };
            this.emit('rebalancingCalculated', {
                portfolioId,
                templateId,
                tradesCount: trades.length,
                deviationFromTarget,
                estimatedCosts: rebalancingResult.estimatedCosts,
                timestamp: new Date()
            });
            return rebalancingResult;
        }
        catch (error) {
            this.emit('rebalancingError', {
                portfolioId,
                templateId,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Get template by ID
     */
    getTemplate(templateId) {
        return this.templates.get(templateId) || null;
    }
    /**
     * List templates with filtering
     */
    listTemplates(filters) {
        let templates = Array.from(this.templates.values());
        if (filters) {
            if (filters.category) {
                templates = templates.filter(t => t.category === filters.category);
            }
            if (filters.riskLevel) {
                templates = templates.filter(t => t.riskLevel >= filters.riskLevel.min && t.riskLevel <= filters.riskLevel.max);
            }
            if (filters.active !== undefined) {
                templates = templates.filter(t => t.active === filters.active);
            }
            if (filters.tags && filters.tags.length > 0) {
                templates = templates.filter(t => filters.tags.some(tag => t.tags.includes(tag)));
            }
        }
        return templates.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    /**
     * Clone template with modifications
     */
    async cloneTemplate(sourceTemplateId, modifications, createdBy) {
        try {
            const sourceTemplate = this.templates.get(sourceTemplateId);
            if (!sourceTemplate) {
                throw new Error('Source template not found');
            }
            const clonedTemplate = {
                ...sourceTemplate,
                name: modifications.name,
                description: modifications.description || `Cloned from ${sourceTemplate.name}`,
                targetAllocation: { ...sourceTemplate.targetAllocation, ...modifications.targetAllocation },
                holdings: modifications.holdings ?
                    this.mergeHoldings(sourceTemplate.holdings, modifications.holdings) :
                    [...sourceTemplate.holdings],
                createdBy,
                tags: [...sourceTemplate.tags, 'cloned']
            };
            delete clonedTemplate.id;
            delete clonedTemplate.createdAt;
            delete clonedTemplate.updatedAt;
            delete clonedTemplate.version;
            return await this.createTemplate(clonedTemplate);
        }
        catch (error) {
            this.emit('templateError', {
                sourceTemplateId,
                operation: 'clone',
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    // Private helper methods
    async processReplication(replicationId) {
        try {
            const replication = this.replications.get(replicationId);
            if (!replication)
                return;
            // Update status
            replication.status = 'in_progress';
            this.replications.set(replicationId, replication);
            // Simulate replication process
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Mark as completed
            replication.status = 'completed';
            replication.completedAt = new Date();
            this.replications.set(replicationId, replication);
            this.emit('replicationCompleted', {
                replicationId,
                templateId: replication.sourceTemplateId,
                targetPortfolioId: replication.targetPortfolioId,
                timestamp: new Date()
            });
        }
        catch (error) {
            const replication = this.replications.get(replicationId);
            if (replication) {
                replication.status = 'failed';
                replication.errors = [error.message];
                this.replications.set(replicationId, replication);
            }
            this.emit('replicationFailed', {
                replicationId,
                error: error.message,
                timestamp: new Date()
            });
        }
    }
    validateAllocation(allocation) {
        const total = allocation.equity + allocation.fixedIncome + allocation.alternatives + allocation.cash +
            (allocation.commodities || 0) + (allocation.realEstate || 0) + (allocation.international || 0);
        if (Math.abs(total - 100) > 0.01) {
            throw new Error(`Allocation must total 100%, got ${total}%`);
        }
    }
    validateHoldings(holdings) {
        const totalWeight = holdings.reduce((sum, holding) => sum + holding.targetWeight, 0);
        if (Math.abs(totalWeight - 100) > 0.01) {
            throw new Error(`Holdings weights must total 100%, got ${totalWeight}%`);
        }
        // Validate individual holdings
        for (const holding of holdings) {
            if (holding.minimumWeight > holding.targetWeight || holding.targetWeight > holding.maximumWeight) {
                throw new Error(`Invalid weight constraints for ${holding.symbol}`);
            }
        }
    }
    mergeHoldings(original, modifications) {
        const merged = [...original];
        for (const mod of modifications) {
            const index = merged.findIndex(h => h.securityId === mod.securityId);
            if (index >= 0) {
                merged[index] = { ...merged[index], ...mod };
            }
        }
        return merged;
    }
    async getEstimatedPrice(securityId) {
        // In production, this would fetch from market data service
        return 100; // Placeholder
    }
    calculateTradingCosts(trades) {
        // Simple cost calculation - in production, this would be more sophisticated
        return trades.reduce((total, trade) => total + (trade.estimatedValue * 0.001), 0);
    }
    initializeDefaultTemplates() {
        // Initialize some common templates
        const conservativeTemplate = {
            name: 'Conservative Growth',
            description: 'Low-risk portfolio focused on capital preservation with modest growth',
            category: 'conservative',
            riskLevel: 3,
            targetAllocation: {
                equity: 30,
                fixedIncome: 60,
                alternatives: 5,
                cash: 5
            },
            allocationsRanges: {
                equity: { min: 20, max: 40, target: 30 },
                fixedIncome: { min: 50, max: 70, target: 60 },
                alternatives: { min: 0, max: 10, target: 5 },
                cash: { min: 0, max: 15, target: 5 }
            },
            minimumInvestment: 10000,
            currency: 'USD',
            rebalancingFrequency: 'quarterly',
            rebalancingThreshold: 5,
            investmentObjectives: ['capital_preservation', 'income_generation'],
            restrictions: [
                { type: 'sector_limit', parameter: 'technology', value: 15, operator: 'max' },
                { type: 'rating_requirement', parameter: 'minimum_rating', value: 'BBB', operator: 'min' }
            ],
            benchmarks: [
                { name: 'Conservative Benchmark', symbol: 'CONSERV', weight: 100, type: 'primary' }
            ],
            feeStructure: {
                managementFee: 0.75
            },
            holdings: [
                {
                    securityId: 'AGG',
                    symbol: 'AGG',
                    name: 'iShares Core U.S. Aggregate Bond ETF',
                    assetClass: 'fixed_income',
                    targetWeight: 40,
                    minimumWeight: 30,
                    maximumWeight: 50,
                    rebalancingPriority: 8
                },
                {
                    securityId: 'VTI',
                    symbol: 'VTI',
                    name: 'Vanguard Total Stock Market ETF',
                    assetClass: 'equity',
                    targetWeight: 20,
                    minimumWeight: 15,
                    maximumWeight: 25,
                    rebalancingPriority: 7
                }
            ],
            performanceMetrics: {
                targetReturn: 5.5,
                maxDrawdown: 8,
                volatilityTarget: 6,
                sharpeRatio: 0.75
            },
            createdBy: 'system',
            active: true,
            tags: ['default', 'conservative', 'balanced']
        };
        this.createTemplate(conservativeTemplate);
    }
}
exports.ModelPortfolioService = ModelPortfolioService;
exports.default = ModelPortfolioService;

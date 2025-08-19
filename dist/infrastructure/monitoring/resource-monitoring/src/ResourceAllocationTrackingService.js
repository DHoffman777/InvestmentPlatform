"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceAllocationTrackingService = void 0;
const events_1 = require("events");
class ResourceAllocationTrackingService extends events_1.EventEmitter {
    config;
    allocations = new Map();
    policies = new Map();
    trackingScheduler;
    allocationMetrics = new Map();
    optimizations = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.initializePolicies();
        this.startTrackingScheduler();
    }
    async requestAllocation(request) {
        try {
            // Validate request
            const validationResult = await this.validateAllocationRequest(request);
            if (!validationResult.valid) {
                return {
                    id: this.generateAllocationId(),
                    status: 'rejected',
                    reason: validationResult.reason,
                    alternatives: validationResult.alternatives
                };
            }
            // Check resource availability
            const availabilityCheck = await this.checkResourceAvailability(request);
            if (!availabilityCheck.available) {
                return {
                    id: this.generateAllocationId(),
                    status: availabilityCheck.partial ? 'partially_approved' : 'rejected',
                    reason: availabilityCheck.reason,
                    alternatives: await this.generateAlternatives(request),
                    estimated_cost: availabilityCheck.estimated_cost
                };
            }
            // Apply allocation policies
            const policyResult = await this.applyAllocationPolicies(request);
            if (policyResult.action === 'reject') {
                return {
                    id: this.generateAllocationId(),
                    status: 'rejected',
                    reason: policyResult.reason,
                    alternatives: policyResult.alternatives
                };
            }
            if (policyResult.action === 'require_approval') {
                const allocation = await this.createPendingAllocation(request, policyResult);
                return {
                    id: allocation.id,
                    status: 'pending',
                    allocation,
                    approval_required: true,
                    reason: policyResult.reason,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                };
            }
            // Create allocation
            const allocation = await this.createAllocation(request, policyResult);
            this.emit('allocationCreated', {
                allocationId: allocation.id,
                resourceId: allocation.resourceId,
                requestor: allocation.requestor,
                timestamp: new Date()
            });
            return {
                id: allocation.id,
                status: 'approved',
                allocation,
                estimated_cost: allocation.cost.total
            };
        }
        catch (error) {
            console.error('Allocation request failed:', error.message);
            return {
                id: this.generateAllocationId(),
                status: 'rejected',
                reason: `Internal error: ${error.message}`
            };
        }
    }
    async releaseAllocation(allocationId, reason) {
        try {
            const allocation = await this.findAllocation(allocationId);
            if (!allocation) {
                throw new Error(`Allocation ${allocationId} not found`);
            }
            if (allocation.status === 'released' || allocation.status === 'expired') {
                return false;
            }
            // Calculate final metrics
            const finalMetrics = await this.calculateFinalAllocationMetrics(allocation);
            // Update allocation status
            allocation.status = 'released';
            allocation.duration.end = new Date();
            // Update efficiency metrics
            await this.updateEfficiencyMetrics(allocation, finalMetrics);
            this.emit('allocationReleased', {
                allocationId: allocation.id,
                resourceId: allocation.resourceId,
                duration: allocation.duration.end.getTime() - allocation.duration.start.getTime(),
                efficiency: finalMetrics.efficiency,
                reason,
                timestamp: new Date()
            });
            return true;
        }
        catch (error) {
            console.error(`Failed to release allocation ${allocationId}:`, error.message);
            return false;
        }
    }
    async trackAllocationUsage(resourceId, snapshot) {
        const resourceAllocations = this.allocations.get(resourceId) || [];
        const activeAllocations = resourceAllocations.filter(a => a.status === 'active');
        for (const allocation of activeAllocations) {
            await this.updateAllocationUsage(allocation, snapshot);
        }
        // Update resource-level allocation metrics
        await this.updateAllocationMetrics(resourceId, snapshot);
        // Check for optimization opportunities
        if (this.config.enableAllocationOptimization) {
            const optimizations = await this.identifyOptimizationOpportunities(resourceId, activeAllocations);
            if (optimizations.length > 0) {
                this.storeOptimizations(resourceId, optimizations);
                this.emit('optimizationOpportunities', {
                    resourceId,
                    count: optimizations.length,
                    totalSavings: optimizations.reduce((sum, opt) => sum + opt.benefits.cost_savings, 0),
                    timestamp: new Date()
                });
            }
        }
    }
    async updateAllocationUsage(allocation, snapshot) {
        const currentTime = new Date();
        // Update CPU allocation usage
        if (allocation.allocation.cpu) {
            allocation.allocation.cpu.used = snapshot.utilization.cpu * allocation.allocation.cpu.allocated;
            allocation.allocation.cpu.efficiency = allocation.allocation.cpu.used / allocation.allocation.cpu.allocated;
            allocation.allocation.cpu.waste = Math.max(0, allocation.allocation.cpu.allocated - allocation.allocation.cpu.used);
        }
        // Update memory allocation usage
        if (allocation.allocation.memory) {
            allocation.allocation.memory.used = snapshot.utilization.memory * allocation.allocation.memory.allocated;
            allocation.allocation.memory.efficiency = allocation.allocation.memory.used / allocation.allocation.memory.allocated;
            allocation.allocation.memory.waste = Math.max(0, allocation.allocation.memory.allocated - allocation.allocation.memory.used);
        }
        // Update storage allocation usage
        if (allocation.allocation.storage) {
            allocation.allocation.storage.used = snapshot.utilization.storage * allocation.allocation.storage.allocated;
            allocation.allocation.storage.efficiency = allocation.allocation.storage.used / allocation.allocation.storage.allocated;
            allocation.allocation.storage.waste = Math.max(0, allocation.allocation.storage.allocated - allocation.allocation.storage.used);
        }
        // Update network allocation usage
        if (allocation.allocation.network) {
            allocation.allocation.network.used = snapshot.utilization.network * allocation.allocation.network.allocated;
            allocation.allocation.network.efficiency = allocation.allocation.network.used / allocation.allocation.network.allocated;
            allocation.allocation.network.waste = Math.max(0, allocation.allocation.network.allocated - allocation.allocation.network.used);
        }
        // Check for waste threshold breaches
        const totalWaste = this.calculateTotalWaste(allocation);
        if (totalWaste > this.config.wasteThreshold) {
            this.emit('allocationWasteDetected', {
                allocationId: allocation.id,
                resourceId: allocation.resourceId,
                wastePercentage: (totalWaste / this.calculateTotalAllocated(allocation)) * 100,
                recommendations: this.generateWasteRecommendations(allocation),
                timestamp: currentTime
            });
        }
        // Check for auto-release conditions
        if (this.config.enableAutoRelease && this.shouldAutoRelease(allocation)) {
            await this.releaseAllocation(allocation.id, 'Auto-released due to low utilization');
        }
    }
    async validateAllocationRequest(request) {
        // Validate required fields
        if (!request.resourceId || !request.requestor || !request.purpose) {
            return {
                valid: false,
                reason: 'Missing required fields: resourceId, requestor, or purpose'
            };
        }
        // Validate requirements
        if (!request.requirements || Object.keys(request.requirements).length === 0) {
            return {
                valid: false,
                reason: 'No resource requirements specified'
            };
        }
        // Validate resource requirements are positive
        for (const [resource, amount] of Object.entries(request.requirements)) {
            if (typeof amount === 'number' && amount <= 0) {
                return {
                    valid: false,
                    reason: `Invalid ${resource} requirement: must be positive`
                };
            }
        }
        // Validate duration
        if (request.duration) {
            if (request.duration.hours && request.duration.hours > this.config.maxAllocationDuration) {
                return {
                    valid: false,
                    reason: `Duration exceeds maximum allowed: ${this.config.maxAllocationDuration} hours`
                };
            }
            if (request.duration.start && request.duration.end) {
                if (request.duration.end <= request.duration.start) {
                    return {
                        valid: false,
                        reason: 'End time must be after start time'
                    };
                }
            }
        }
        // Validate cost limit
        if (request.cost_limit && request.cost_limit <= 0) {
            return {
                valid: false,
                reason: 'Cost limit must be positive'
            };
        }
        return { valid: true };
    }
    async checkResourceAvailability(request) {
        const resourceAllocations = this.allocations.get(request.resourceId) || [];
        const activeAllocations = resourceAllocations.filter(a => a.status === 'active' || a.status === 'approved');
        // Calculate current resource usage
        const currentUsage = this.calculateCurrentResourceUsage(activeAllocations);
        // Check availability for each requested resource
        const availabilityChecks = [];
        if (request.requirements.cpu) {
            const availableCpu = 100 - currentUsage.cpu; // Assume 100% capacity
            availabilityChecks.push({
                resource: 'cpu',
                requested: request.requirements.cpu,
                available: availableCpu,
                sufficient: request.requirements.cpu <= availableCpu
            });
        }
        if (request.requirements.memory) {
            const availableMemory = 100 - currentUsage.memory;
            availabilityChecks.push({
                resource: 'memory',
                requested: request.requirements.memory,
                available: availableMemory,
                sufficient: request.requirements.memory <= availableMemory
            });
        }
        if (request.requirements.storage) {
            const availableStorage = 1000 - currentUsage.storage; // Assume 1000GB capacity
            availabilityChecks.push({
                resource: 'storage',
                requested: request.requirements.storage,
                available: availableStorage,
                sufficient: request.requirements.storage <= availableStorage
            });
        }
        const insufficientResources = availabilityChecks.filter(check => !check.sufficient);
        if (insufficientResources.length === 0) {
            return {
                available: true,
                partial: false,
                estimated_cost: this.estimateAllocationCost(request)
            };
        }
        if (insufficientResources.length < availabilityChecks.length) {
            return {
                available: false,
                partial: true,
                reason: `Insufficient resources: ${insufficientResources.map(r => r.resource).join(', ')}`,
                estimated_cost: this.estimateAllocationCost(request)
            };
        }
        return {
            available: false,
            partial: false,
            reason: `Insufficient resources: ${insufficientResources.map(r => r.resource).join(', ')}`
        };
    }
    async applyAllocationPolicies(request) {
        const applicablePolicies = Array.from(this.policies.values())
            .filter(policy => policy.enabled)
            .sort((a, b) => b.priority - a.priority);
        for (const policy of applicablePolicies) {
            const matches = await this.evaluatePolicyConditions(policy, request);
            if (matches) {
                const primaryAction = policy.actions[0]; // Use first action for simplicity
                switch (primaryAction.type) {
                    case 'approve':
                        return { action: 'approve' };
                    case 'reject':
                        return {
                            action: 'reject',
                            reason: primaryAction.message || `Rejected by policy: ${policy.name}`
                        };
                    case 'require_approval':
                        return {
                            action: 'require_approval',
                            reason: primaryAction.message || `Approval required by policy: ${policy.name}`
                        };
                    case 'modify_allocation':
                        return {
                            action: 'modify',
                            modifications: primaryAction.parameters,
                            reason: `Modified by policy: ${policy.name}`
                        };
                }
            }
        }
        // Default action if no policies match
        return { action: 'approve' };
    }
    async createAllocation(request, policyResult) {
        const allocationId = this.generateAllocationId();
        const startTime = request.duration?.start || new Date();
        const endTime = request.duration?.end ||
            (request.duration?.hours ? new Date(startTime.getTime() + request.duration.hours * 60 * 60 * 1000) : undefined);
        const allocation = {
            id: allocationId,
            resourceId: request.resourceId,
            allocation: {
                cpu: request.requirements.cpu ? {
                    requested: request.requirements.cpu,
                    allocated: request.requirements.cpu,
                    used: 0,
                    reserved: 0,
                    unit: 'percent',
                    efficiency: 0,
                    waste: 0
                } : undefined,
                memory: request.requirements.memory ? {
                    requested: request.requirements.memory,
                    allocated: request.requirements.memory,
                    used: 0,
                    reserved: 0,
                    unit: 'percent',
                    efficiency: 0,
                    waste: 0
                } : undefined,
                storage: request.requirements.storage ? {
                    requested: request.requirements.storage,
                    allocated: request.requirements.storage,
                    used: 0,
                    reserved: 0,
                    unit: 'GB',
                    efficiency: 0,
                    waste: 0
                } : undefined,
                network: request.requirements.network ? {
                    requested: request.requirements.network,
                    allocated: request.requirements.network,
                    used: 0,
                    reserved: 0,
                    unit: 'Mbps',
                    efficiency: 0,
                    waste: 0
                } : undefined,
                custom: {}
            },
            requestor: request.requestor,
            purpose: request.purpose,
            duration: {
                start: startTime,
                end: endTime,
                duration_hours: request.duration?.hours
            },
            priority: request.priority,
            status: 'active',
            cost: {
                hourly: this.calculateHourlyCost(request),
                total: 0, // Will be calculated based on actual duration
                currency: 'USD'
            },
            constraints: request.constraints || [],
            tags: request.tags || {}
        };
        // Store allocation
        this.storeAllocation(allocation);
        return allocation;
    }
    async createPendingAllocation(request, policyResult) {
        const allocation = await this.createAllocation(request, policyResult);
        allocation.status = 'requested';
        return allocation;
    }
    async generateAlternatives(request) {
        const alternatives = [];
        // Alternative timing
        const timeAlternative = await this.generateTimeAlternative(request);
        if (timeAlternative) {
            alternatives.push(timeAlternative);
        }
        // Modified requirements
        const requirementAlternative = await this.generateRequirementAlternative(request);
        if (requirementAlternative) {
            alternatives.push(requirementAlternative);
        }
        // Alternative resource
        const resourceAlternative = await this.generateResourceAlternative(request);
        if (resourceAlternative) {
            alternatives.push(resourceAlternative);
        }
        return alternatives.sort((a, b) => b.confidence - a.confidence);
    }
    async updateAllocationMetrics(resourceId, snapshot) {
        const now = new Date();
        const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        const resourceAllocations = this.allocations.get(resourceId) || [];
        const periodAllocations = resourceAllocations.filter(a => a.duration.start >= periodStart ||
            (a.duration.end && a.duration.end >= periodStart) ||
            a.status === 'active');
        const metrics = {
            resourceId,
            period: { start: periodStart, end: now },
            total_allocations: periodAllocations.length,
            active_allocations: periodAllocations.filter(a => a.status === 'active').length,
            completed_allocations: periodAllocations.filter(a => a.status === 'released').length,
            cancelled_allocations: periodAllocations.filter(a => a.status === 'expired').length,
            utilization: {
                cpu: this.calculateUtilizationMetric('cpu', periodAllocations),
                memory: this.calculateUtilizationMetric('memory', periodAllocations),
                storage: this.calculateUtilizationMetric('storage', periodAllocations),
                network: this.calculateUtilizationMetric('network', periodAllocations)
            },
            efficiency: this.calculateEfficiencyMetrics(periodAllocations),
            cost: this.calculateCostMetrics(periodAllocations),
            trends: this.calculateTrendMetrics(resourceId, periodAllocations)
        };
        this.allocationMetrics.set(resourceId, metrics);
        this.emit('metricsUpdated', {
            resourceId,
            metrics,
            timestamp: now
        });
    }
    async identifyOptimizationOpportunities(resourceId, allocations) {
        const optimizations = [];
        // Consolidation opportunities
        const consolidationOpp = await this.identifyConsolidationOpportunity(resourceId, allocations);
        if (consolidationOpp) {
            optimizations.push(consolidationOpp);
        }
        // Rightsizing opportunities
        const rightsizingOpps = await this.identifyRightsizingOpportunities(resourceId, allocations);
        optimizations.push(...rightsizingOpps);
        // Scheduling opportunities
        const schedulingOpp = await this.identifySchedulingOpportunity(resourceId, allocations);
        if (schedulingOpp) {
            optimizations.push(schedulingOpp);
        }
        return optimizations.sort((a, b) => b.priority - a.priority);
    }
    // Helper methods
    initializePolicies() {
        // Cost limit policy
        this.policies.set('cost_limit', {
            id: 'cost_limit',
            name: 'Cost Limit Policy',
            description: 'Require approval for high-cost allocations',
            conditions: [
                {
                    type: 'cost',
                    parameter: 'estimated_cost',
                    operator: 'gt',
                    value: 1000,
                    weight: 1.0
                }
            ],
            actions: [
                {
                    type: 'require_approval',
                    parameters: {},
                    message: 'High-cost allocation requires approval'
                }
            ],
            priority: 100,
            enabled: true,
            created_by: 'system',
            created_at: new Date(),
            updated_at: new Date()
        });
        // Duration limit policy
        this.policies.set('duration_limit', {
            id: 'duration_limit',
            name: 'Duration Limit Policy',
            description: 'Require approval for long-duration allocations',
            conditions: [
                {
                    type: 'duration',
                    parameter: 'duration_hours',
                    operator: 'gt',
                    value: 168, // 1 week
                    weight: 1.0
                }
            ],
            actions: [
                {
                    type: 'require_approval',
                    parameters: {},
                    message: 'Long-duration allocation requires approval'
                }
            ],
            priority: 90,
            enabled: true,
            created_by: 'system',
            created_at: new Date(),
            updated_at: new Date()
        });
    }
    startTrackingScheduler() {
        this.trackingScheduler = setInterval(async () => {
            try {
                await this.performScheduledTracking();
            }
            catch (error) {
                console.error('Scheduled allocation tracking failed:', error.message);
            }
        }, this.config.trackingInterval);
    }
    async performScheduledTracking() {
        // Check for expired allocations
        await this.checkExpiredAllocations();
        // Update allocation metrics
        await this.updateAllResourceMetrics();
        // Clean up old data
        await this.cleanupOldData();
        this.emit('trackingCompleted', { timestamp: new Date() });
    }
    async checkExpiredAllocations() {
        const now = new Date();
        for (const [resourceId, allocations] of this.allocations) {
            for (const allocation of allocations) {
                if (allocation.status === 'active' &&
                    allocation.duration.end &&
                    allocation.duration.end <= now) {
                    await this.releaseAllocation(allocation.id, 'Expired');
                }
            }
        }
    }
    storeAllocation(allocation) {
        if (!this.allocations.has(allocation.resourceId)) {
            this.allocations.set(allocation.resourceId, []);
        }
        const resourceAllocations = this.allocations.get(allocation.resourceId);
        resourceAllocations.push(allocation);
    }
    storeOptimizations(resourceId, optimizations) {
        this.optimizations.set(resourceId, optimizations);
    }
    async findAllocation(allocationId) {
        for (const allocations of this.allocations.values()) {
            const allocation = allocations.find(a => a.id === allocationId);
            if (allocation) {
                return allocation;
            }
        }
        return null;
    }
    // Getter methods
    getAllocations(resourceId) {
        return this.allocations.get(resourceId) || [];
    }
    getAllocationMetrics(resourceId) {
        return this.allocationMetrics.get(resourceId);
    }
    getOptimizations(resourceId) {
        return this.optimizations.get(resourceId) || [];
    }
    getPolicies() {
        return Array.from(this.policies.values());
    }
    // Helper method implementations (simplified for brevity)
    generateAllocationId() {
        return `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    calculateCurrentResourceUsage(allocations) {
        return { cpu: 0, memory: 0, storage: 0, network: 0 };
    }
    estimateAllocationCost(request) {
        return 100; // Simplified cost estimation
    }
    calculateHourlyCost(request) {
        return 10; // Simplified hourly cost calculation
    }
    async evaluatePolicyConditions(policy, request) {
        return true; // Simplified policy evaluation
    }
    calculateTotalWaste(allocation) {
        return 0; // Simplified waste calculation
    }
    calculateTotalAllocated(allocation) {
        return 100; // Simplified total allocation calculation
    }
    generateWasteRecommendations(allocation) {
        return ['Consider rightsizing allocation', 'Review usage patterns'];
    }
    shouldAutoRelease(allocation) {
        return false; // Simplified auto-release logic
    }
    async calculateFinalAllocationMetrics(allocation) {
        return { efficiency: 0.8 };
    }
    async updateEfficiencyMetrics(allocation, finalMetrics) {
        // Implementation for updating efficiency metrics
    }
    // Additional helper methods...
    async generateTimeAlternative(request) { return null; }
    async generateRequirementAlternative(request) { return null; }
    async generateResourceAlternative(request) { return null; }
    calculateUtilizationMetric(resource, allocations) {
        return {
            total_allocated: 0,
            total_used: 0,
            peak_usage: 0,
            average_usage: 0,
            utilization_percentage: 0,
            waste_percentage: 0,
            efficiency_score: 0
        };
    }
    calculateEfficiencyMetrics(allocations) { return {}; }
    calculateCostMetrics(allocations) { return {}; }
    calculateTrendMetrics(resourceId, allocations) { return {}; }
    async identifyConsolidationOpportunity(resourceId, allocations) { return null; }
    async identifyRightsizingOpportunities(resourceId, allocations) { return []; }
    async identifySchedulingOpportunity(resourceId, allocations) { return null; }
    async updateAllResourceMetrics() { }
    async cleanupOldData() { }
    async shutdown() {
        if (this.trackingScheduler) {
            clearInterval(this.trackingScheduler);
        }
        this.emit('shutdown');
    }
}
exports.ResourceAllocationTrackingService = ResourceAllocationTrackingService;

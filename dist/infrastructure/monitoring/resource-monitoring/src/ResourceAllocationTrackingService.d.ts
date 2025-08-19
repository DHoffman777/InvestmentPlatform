import { EventEmitter } from 'events';
import { ResourceAllocation, AllocationConstraint, ResourceUtilizationSnapshot } from './ResourceDataModel';
export interface AllocationTrackingConfig {
    trackingInterval: number;
    allocationTimeoutHours: number;
    enableAutoRelease: boolean;
    enableAllocationOptimization: boolean;
    wasteThreshold: number;
    efficiencyThreshold: number;
    maxAllocationDuration: number;
    costTrackingEnabled: boolean;
    approvalRequired: boolean;
    notificationChannels: string[];
}
export interface AllocationRequest {
    resourceId: string;
    requestor: string;
    purpose: string;
    requirements: {
        cpu?: number;
        memory?: number;
        storage?: number;
        network?: number;
        custom?: Record<string, number>;
    };
    duration?: {
        hours?: number;
        start?: Date;
        end?: Date;
    };
    priority: 'low' | 'normal' | 'high' | 'critical';
    constraints?: AllocationConstraint[];
    tags?: Record<string, string>;
    cost_limit?: number;
    auto_release?: boolean;
}
export interface AllocationResponse {
    id: string;
    status: 'approved' | 'rejected' | 'pending' | 'partially_approved';
    allocation?: ResourceAllocation;
    reason?: string;
    alternatives?: AllocationSuggestion[];
    estimated_cost?: number;
    approval_required?: boolean;
    expires_at?: Date;
}
export interface AllocationSuggestion {
    type: 'alternative_resource' | 'modified_requirements' | 'different_timing' | 'shared_allocation';
    description: string;
    allocation: Partial<ResourceAllocation>;
    benefits: {
        cost_savings: number;
        efficiency_improvement: number;
        availability_improvement: number;
    };
    trade_offs: string[];
    confidence: number;
}
export interface AllocationPolicy {
    id: string;
    name: string;
    description: string;
    conditions: PolicyCondition[];
    actions: PolicyAction[];
    priority: number;
    enabled: boolean;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}
export interface PolicyCondition {
    type: 'resource_type' | 'requestor' | 'purpose' | 'cost' | 'duration' | 'time_window' | 'utilization' | 'availability';
    parameter: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'contains' | 'regex';
    value: any;
    weight: number;
}
export interface PolicyAction {
    type: 'approve' | 'reject' | 'require_approval' | 'modify_allocation' | 'suggest_alternative' | 'apply_constraints';
    parameters: Record<string, any>;
    message?: string;
}
export interface AllocationMetrics {
    resourceId: string;
    period: {
        start: Date;
        end: Date;
    };
    total_allocations: number;
    active_allocations: number;
    completed_allocations: number;
    cancelled_allocations: number;
    utilization: {
        cpu: AllocationUtilizationMetric;
        memory: AllocationUtilizationMetric;
        storage: AllocationUtilizationMetric;
        network: AllocationUtilizationMetric;
    };
    efficiency: {
        overall: number;
        waste_percentage: number;
        over_allocation_percentage: number;
        under_utilization_percentage: number;
    };
    cost: {
        total_allocated: number;
        total_used: number;
        waste_cost: number;
        efficiency_ratio: number;
    };
    trends: {
        allocation_growth_rate: number;
        utilization_trend: 'increasing' | 'decreasing' | 'stable';
        efficiency_trend: 'improving' | 'degrading' | 'stable';
    };
}
export interface AllocationUtilizationMetric {
    total_allocated: number;
    total_used: number;
    peak_usage: number;
    average_usage: number;
    utilization_percentage: number;
    waste_percentage: number;
    efficiency_score: number;
}
export interface AllocationOptimization {
    resourceId: string;
    type: 'consolidation' | 'reallocation' | 'rightsizing' | 'scheduling' | 'sharing';
    description: string;
    current_state: {
        allocations: number;
        total_cost: number;
        efficiency: number;
        waste: number;
    };
    proposed_state: {
        allocations: number;
        total_cost: number;
        efficiency: number;
        waste: number;
    };
    implementation: {
        affected_allocations: string[];
        required_actions: string[];
        estimated_effort: 'low' | 'medium' | 'high';
        risk_level: 'low' | 'medium' | 'high';
        rollback_plan: string[];
    };
    benefits: {
        cost_savings: number;
        efficiency_improvement: number;
        waste_reduction: number;
        performance_impact: number;
    };
    constraints: {
        business_hours_only: boolean;
        approval_required: boolean;
        minimum_notice: number;
        blackout_periods: Array<{
            start: Date;
            end: Date;
            reason: string;
        }>;
    };
    priority: number;
    confidence: number;
    created_at: Date;
}
export declare class ResourceAllocationTrackingService extends EventEmitter {
    private config;
    private allocations;
    private policies;
    private trackingScheduler?;
    private allocationMetrics;
    private optimizations;
    constructor(config: AllocationTrackingConfig);
    requestAllocation(request: AllocationRequest): Promise<AllocationResponse>;
    releaseAllocation(allocationId: string, reason?: string): Promise<boolean>;
    trackAllocationUsage(resourceId: string, snapshot: ResourceUtilizationSnapshot): Promise<void>;
    private updateAllocationUsage;
    private validateAllocationRequest;
    private checkResourceAvailability;
    private applyAllocationPolicies;
    private createAllocation;
    private createPendingAllocation;
    private generateAlternatives;
    private updateAllocationMetrics;
    private identifyOptimizationOpportunities;
    private initializePolicies;
    private startTrackingScheduler;
    private performScheduledTracking;
    private checkExpiredAllocations;
    private storeAllocation;
    private storeOptimizations;
    private findAllocation;
    getAllocations(resourceId: string): ResourceAllocation[];
    getAllocationMetrics(resourceId: string): AllocationMetrics | undefined;
    getOptimizations(resourceId: string): AllocationOptimization[];
    getPolicies(): AllocationPolicy[];
    private generateAllocationId;
    private calculateCurrentResourceUsage;
    private estimateAllocationCost;
    private calculateHourlyCost;
    private evaluatePolicyConditions;
    private calculateTotalWaste;
    private calculateTotalAllocated;
    private generateWasteRecommendations;
    private shouldAutoRelease;
    private calculateFinalAllocationMetrics;
    private updateEfficiencyMetrics;
    private generateTimeAlternative;
    private generateRequirementAlternative;
    private generateResourceAlternative;
    private calculateUtilizationMetric;
    private calculateEfficiencyMetrics;
    private calculateCostMetrics;
    private calculateTrendMetrics;
    private identifyConsolidationOpportunity;
    private identifyRightsizingOpportunities;
    private identifySchedulingOpportunity;
    private updateAllResourceMetrics;
    private cleanupOldData;
    shutdown(): Promise<void>;
}

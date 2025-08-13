import { EventEmitter } from 'events';
import {
  ResourceMetric,
  ResourceUtilizationSnapshot,
  ResourceEfficiency,
  ResourceType,
  ResourceMetricType,
  ResourceRecommendation,
  ResourceAnomaly,
  ResourceCost,
  CostDetail
} from './ResourceDataModel';

export interface EfficiencyAnalyticsConfig {
  analysisInterval: number;
  benchmarkUpdateInterval: number;
  wasteThresholds: {
    overProvisioned: number;
    underUtilized: number;
    idle: number;
  };
  efficiencyTargets: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
    cost: number;
  };
  enableMLAnalysis: boolean;
  enableBenchmarking: boolean;
  costAnalysisEnabled: boolean;
}

export interface EfficiencyBenchmark {
  resourceType: ResourceType;
  industry: {
    average: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
  internal: {
    average: number;
    best: number;
    worst: number;
    variance: number;
  };
  target: number;
  lastUpdated: Date;
  sampleSize: number;
}

export interface EfficiencyInsight {
  id: string;
  resourceId: string;
  type: 'waste_detection' | 'optimization_opportunity' | 'benchmark_comparison' | 'cost_analysis' | 'trend_analysis';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    efficiency_improvement: number;
    cost_savings: number;
    performance_gain: number;
    risk_reduction: number;
  };
  evidence: {
    metrics: string[];
    timeRange: { start: Date; end: Date };
    data_points: number;
    confidence: number;
  };
  recommendations: string[];
  priority_score: number;
  created_at: Date;
  expires_at?: Date;
}

export interface WasteAnalysis {
  resourceId: string;
  totalWaste: number;
  wasteBreakdown: {
    overProvisioned: {
      amount: number;
      percentage: number;
      resources: Array<{
        type: ResourceType;
        allocated: number;
        used: number;
        waste: number;
      }>;
    };
    underUtilized: {
      amount: number;
      percentage: number;
      resources: Array<{
        type: ResourceType;
        capacity: number;
        usage: number;
        efficiency: number;
      }>;
    };
    idle: {
      amount: number;
      percentage: number;
      duration: number;
      cost_impact: number;
    };
    inefficientAllocation: {
      amount: number;
      percentage: number;
      misallocations: Array<{
        resource: string;
        current: number;
        optimal: number;
        waste: number;
      }>;
    };
  };
  recommendations: Array<{
    action: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
    priority: number;
  }>;
  timestamp: Date;
}

export interface OptimizationOpportunity {
  id: string;
  resourceId: string;
  type: 'rightsizing' | 'consolidation' | 'migration' | 'scheduling' | 'caching' | 'compression';
  title: string;
  description: string;
  currentState: {
    configuration: Record<string, any>;
    utilization: number;
    cost: number;
    performance: number;
  };
  proposedState: {
    configuration: Record<string, any>;
    utilization: number;
    cost: number;
    performance: number;
  };
  benefits: {
    cost_reduction: number;
    performance_improvement: number;
    efficiency_gain: number;
    risk_mitigation: number;
  };
  implementation: {
    complexity: 'low' | 'medium' | 'high';
    timeline: string;
    steps: string[];
    risks: string[];
    dependencies: string[];
  };
  roi: {
    investment: number;
    annual_savings: number;
    payback_period_months: number;
    net_present_value: number;
  };
  confidence: number;
  priority: number;
  created_at: Date;
}

export class ResourceEfficiencyAnalyticsService extends EventEmitter {
  private benchmarks: Map<ResourceType, EfficiencyBenchmark> = new Map();
  private insights: Map<string, EfficiencyInsight[]> = new Map();
  private wasteAnalyses: Map<string, WasteAnalysis[]> = new Map();
  private optimizationOpportunities: Map<string, OptimizationOpportunity[]> = new Map();
  private analysisScheduler?: NodeJS.Timeout;

  constructor(private config: EfficiencyAnalyticsConfig) {
    super();
    this.initializeBenchmarks();
    this.startAnalysisScheduler();
  }

  async analyzeResourceEfficiency(snapshot: ResourceUtilizationSnapshot): Promise<ResourceEfficiency> {
    const efficiency = await this.calculateEfficiencyScore(snapshot);
    const benchmarks = await this.getBenchmarks(snapshot.resourceType);
    const wasteAnalysis = await this.analyzeWaste(snapshot);
    const opportunities = await this.identifyOptimizationOpportunities(snapshot);

    const resourceEfficiency: ResourceEfficiency = {
      score: efficiency.overall,
      breakdown: efficiency.breakdown,
      benchmarks: {
        industry: benchmarks.industry.average,
        internal: benchmarks.internal.average,
        target: benchmarks.target
      },
      improvements: {
        potential: this.calculateImprovementPotential(efficiency, benchmarks),
        priority: this.determineImprovementPriority(efficiency, wasteAnalysis),
        estimated_savings: wasteAnalysis.totalWaste,
        effort_required: this.estimateEffort(opportunities)
      },
      waste: {
        over_provisioned: wasteAnalysis.wasteBreakdown.overProvisioned.percentage,
        under_utilized: wasteAnalysis.wasteBreakdown.underUtilized.percentage,
        idle_resources: wasteAnalysis.wasteBreakdown.idle.percentage,
        inefficient_allocation: wasteAnalysis.wasteBreakdown.inefficientAllocation.percentage
      }
    };

    // Generate insights
    const insights = await this.generateEfficiencyInsights(snapshot, resourceEfficiency, wasteAnalysis);
    this.storeInsights(snapshot.resourceId, insights);

    // Store waste analysis
    this.storeWasteAnalysis(snapshot.resourceId, wasteAnalysis);

    // Store optimization opportunities
    this.storeOptimizationOpportunities(snapshot.resourceId, opportunities);

    this.emit('efficiencyAnalyzed', {
      resourceId: snapshot.resourceId,
      efficiency: resourceEfficiency,
      insights: insights.length,
      opportunities: opportunities.length,
      timestamp: new Date()
    });

    return resourceEfficiency;
  }

  private async calculateEfficiencyScore(snapshot: ResourceUtilizationSnapshot): Promise<{
    overall: number;
    breakdown: {
      utilization: number;
      performance: number;
      cost: number;
      reliability: number;
    };
  }> {
    // Calculate utilization efficiency (0-1 scale)
    const utilizationScore = this.calculateUtilizationEfficiency(snapshot.utilization);

    // Calculate performance efficiency
    const performanceScore = this.calculatePerformanceEfficiency(snapshot);

    // Calculate cost efficiency
    const costScore = this.config.costAnalysisEnabled 
      ? await this.calculateCostEfficiency(snapshot)
      : 0.8; // Default if cost analysis disabled

    // Calculate reliability efficiency
    const reliabilityScore = this.calculateReliabilityEfficiency(snapshot.health);

    const breakdown = {
      utilization: utilizationScore,
      performance: performanceScore,
      cost: costScore,
      reliability: reliabilityScore
    };

    // Weighted overall score
    const weights = { utilization: 0.3, performance: 0.25, cost: 0.25, reliability: 0.2 };
    const overall = (
      breakdown.utilization * weights.utilization +
      breakdown.performance * weights.performance +
      breakdown.cost * weights.cost +
      breakdown.reliability * weights.reliability
    );

    return { overall, breakdown };
  }

  private calculateUtilizationEfficiency(utilization: ResourceUtilization): number {
    // Ideal utilization range is 70-85% for most resources
    const idealRange = { min: 0.7, max: 0.85 };
    
    const scores = [
      this.scoreUtilization(utilization.cpu, idealRange),
      this.scoreUtilization(utilization.memory, idealRange),
      this.scoreUtilization(utilization.storage, idealRange),
      this.scoreUtilization(utilization.network, idealRange)
    ].filter(score => score > 0); // Filter out zero values

    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  private scoreUtilization(usage: number, idealRange: { min: number; max: number }): number {
    if (usage === 0) return 0; // Resource not in use
    
    if (usage >= idealRange.min && usage <= idealRange.max) {
      return 1.0; // Optimal usage
    } else if (usage < idealRange.min) {
      // Under-utilized - linear penalty
      return usage / idealRange.min;
    } else {
      // Over-utilized - exponential penalty
      const excess = usage - idealRange.max;
      return Math.max(0, 1 - (excess * 2));
    }
  }

  private calculatePerformanceEfficiency(snapshot: ResourceUtilizationSnapshot): number {
    // Calculate performance efficiency based on response times, throughput, etc.
    const performanceMetrics = snapshot.metrics.filter(m => 
      m.metricType === ResourceMetricType.APP_RESPONSE_TIME ||
      m.metricType === ResourceMetricType.APP_THROUGHPUT ||
      m.metricType === ResourceMetricType.DB_QUERY_EXECUTION_TIME
    );

    if (performanceMetrics.length === 0) {
      return 0.8; // Default performance score
    }

    // Implement performance scoring logic
    let performanceScore = 0.8;
    
    // Check response time metrics
    const responseTimeMetrics = performanceMetrics.filter(m => 
      m.metricType === ResourceMetricType.APP_RESPONSE_TIME
    );
    
    if (responseTimeMetrics.length > 0) {
      const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length;
      // Assume target response time is 500ms
      const targetResponseTime = 500;
      performanceScore *= Math.max(0.1, Math.min(1, targetResponseTime / avgResponseTime));
    }

    return Math.min(1, performanceScore);
  }

  private async calculateCostEfficiency(snapshot: ResourceUtilizationSnapshot): Promise<number> {
    // Calculate cost per unit of work/output
    const costData = await this.getCostData(snapshot.resourceId);
    if (!costData) {
      return 0.8; // Default if no cost data
    }

    // Calculate cost efficiency metrics
    const utilizationCostRatio = snapshot.utilization.overall / (costData.costs.total.amount / 1000);
    const industryBenchmark = 0.75; // Benchmark cost efficiency
    
    return Math.min(1, utilizationCostRatio / industryBenchmark);
  }

  private calculateReliabilityEfficiency(health: ResourceHealth): number {
    // Convert health score to efficiency score
    return health.score;
  }

  private async analyzeWaste(snapshot: ResourceUtilizationSnapshot): Promise<WasteAnalysis> {
    const overProvisionedAnalysis = this.analyzeOverProvisioning(snapshot);
    const underUtilizedAnalysis = this.analyzeUnderUtilization(snapshot);
    const idleAnalysis = this.analyzeIdleResources(snapshot);
    const inefficientAllocationAnalysis = this.analyzeInefficientAllocation(snapshot);

    const totalWaste = (
      overProvisionedAnalysis.amount +
      underUtilizedAnalysis.amount +
      idleAnalysis.amount +
      inefficientAllocationAnalysis.amount
    );

    return {
      resourceId: snapshot.resourceId,
      totalWaste,
      wasteBreakdown: {
        overProvisioned: overProvisionedAnalysis,
        underUtilized: underUtilizedAnalysis,
        idle: idleAnalysis,
        inefficientAllocation: inefficientAllocationAnalysis
      },
      recommendations: this.generateWasteRecommendations(snapshot, {
        overProvisionedAnalysis,
        underUtilizedAnalysis,
        idleAnalysis,
        inefficientAllocationAnalysis
      }),
      timestamp: new Date()
    };
  }

  private analyzeOverProvisioning(snapshot: ResourceUtilizationSnapshot): any {
    const resources = [];
    let totalWaste = 0;

    // Check CPU over-provisioning
    if (snapshot.utilization.cpu < this.config.wasteThresholds.overProvisioned) {
      const cpuWaste = (this.config.wasteThresholds.overProvisioned - snapshot.utilization.cpu) * 100;
      resources.push({
        type: ResourceType.CPU,
        allocated: 100,
        used: snapshot.utilization.cpu * 100,
        waste: cpuWaste
      });
      totalWaste += cpuWaste;
    }

    // Check memory over-provisioning
    if (snapshot.utilization.memory < this.config.wasteThresholds.overProvisioned) {
      const memoryWaste = (this.config.wasteThresholds.overProvisioned - snapshot.utilization.memory) * 100;
      resources.push({
        type: ResourceType.MEMORY,
        allocated: 100,
        used: snapshot.utilization.memory * 100,
        waste: memoryWaste
      });
      totalWaste += memoryWaste;
    }

    return {
      amount: totalWaste,
      percentage: totalWaste > 0 ? (totalWaste / (resources.length * 100)) * 100 : 0,
      resources
    };
  }

  private analyzeUnderUtilization(snapshot: ResourceUtilizationSnapshot): any {
    const resources = [];
    let totalUnderUtilization = 0;

    const utilizationMetrics = [
      { type: ResourceType.CPU, usage: snapshot.utilization.cpu, capacity: 1 },
      { type: ResourceType.MEMORY, usage: snapshot.utilization.memory, capacity: 1 },
      { type: ResourceType.STORAGE, usage: snapshot.utilization.storage, capacity: 1 },
      { type: ResourceType.NETWORK, usage: snapshot.utilization.network, capacity: 1 }
    ];

    for (const metric of utilizationMetrics) {
      if (metric.usage < this.config.wasteThresholds.underUtilized && metric.usage > 0) {
        const efficiency = metric.usage / metric.capacity;
        resources.push({
          type: metric.type,
          capacity: metric.capacity * 100,
          usage: metric.usage * 100,
          efficiency
        });
        totalUnderUtilization += (1 - efficiency) * 100;
      }
    }

    return {
      amount: totalUnderUtilization,
      percentage: totalUnderUtilization > 0 ? (totalUnderUtilization / (resources.length * 100)) * 100 : 0,
      resources
    };
  }

  private analyzeIdleResources(snapshot: ResourceUtilizationSnapshot): any {
    const isIdle = snapshot.utilization.overall < this.config.wasteThresholds.idle;
    const idleDuration = isIdle ? 3600000 : 0; // 1 hour if idle
    const costImpact = isIdle ? 100 : 0; // Estimated cost impact

    return {
      amount: isIdle ? 100 : 0,
      percentage: isIdle ? 100 : 0,
      duration: idleDuration,
      cost_impact: costImpact
    };
  }

  private analyzeInefficientAllocation(snapshot: ResourceUtilizationSnapshot): any {
    const misallocations = [];
    let totalInefficiency = 0;

    // Analyze CPU allocation efficiency
    const optimalCpuAllocation = this.calculateOptimalAllocation(snapshot.utilization.cpu, ResourceType.CPU);
    if (Math.abs(optimalCpuAllocation - 100) > 10) {
      misallocations.push({
        resource: 'cpu',
        current: 100,
        optimal: optimalCpuAllocation,
        waste: Math.abs(100 - optimalCpuAllocation)
      });
      totalInefficiency += Math.abs(100 - optimalCpuAllocation);
    }

    // Analyze memory allocation efficiency
    const optimalMemoryAllocation = this.calculateOptimalAllocation(snapshot.utilization.memory, ResourceType.MEMORY);
    if (Math.abs(optimalMemoryAllocation - 100) > 10) {
      misallocations.push({
        resource: 'memory',
        current: 100,
        optimal: optimalMemoryAllocation,
        waste: Math.abs(100 - optimalMemoryAllocation)
      });
      totalInefficiency += Math.abs(100 - optimalMemoryAllocation);
    }

    return {
      amount: totalInefficiency,
      percentage: totalInefficiency > 0 ? (totalInefficiency / (misallocations.length * 100)) * 100 : 0,
      misallocations
    };
  }

  private calculateOptimalAllocation(currentUtilization: number, resourceType: ResourceType): number {
    // Calculate optimal allocation based on utilization patterns
    const targetUtilization = this.config.efficiencyTargets[resourceType.toString() as keyof typeof this.config.efficiencyTargets] || 0.8;
    return Math.ceil((currentUtilization / targetUtilization) * 100);
  }

  private generateWasteRecommendations(snapshot: ResourceUtilizationSnapshot, wasteData: any): Array<any> {
    const recommendations = [];

    if (wasteData.overProvisionedAnalysis.amount > 0) {
      recommendations.push({
        action: 'Reduce over-provisioned resources',
        impact: wasteData.overProvisionedAnalysis.amount,
        effort: 'low' as const,
        priority: 90
      });
    }

    if (wasteData.underUtilizedAnalysis.amount > 0) {
      recommendations.push({
        action: 'Optimize resource utilization',
        impact: wasteData.underUtilizedAnalysis.amount,
        effort: 'medium' as const,
        priority: 70
      });
    }

    if (wasteData.idleAnalysis.amount > 0) {
      recommendations.push({
        action: 'Schedule or terminate idle resources',
        impact: wasteData.idleAnalysis.amount,
        effort: 'low' as const,
        priority: 95
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private async identifyOptimizationOpportunities(snapshot: ResourceUtilizationSnapshot): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    // Rightsizing opportunity
    const rightsizingOpp = await this.analyzeRightsizingOpportunity(snapshot);
    if (rightsizingOpp) {
      opportunities.push(rightsizingOpp);
    }

    // Consolidation opportunity
    const consolidationOpp = await this.analyzeConsolidationOpportunity(snapshot);
    if (consolidationOpp) {
      opportunities.push(consolidationOpp);
    }

    // Scheduling opportunity
    const schedulingOpp = await this.analyzeSchedulingOpportunity(snapshot);
    if (schedulingOpp) {
      opportunities.push(schedulingOpp);
    }

    return opportunities.sort((a, b) => b.priority - a.priority);
  }

  private async analyzeRightsizingOpportunity(snapshot: ResourceUtilizationSnapshot): Promise<OptimizationOpportunity | null> {
    const utilizationThreshold = 0.3; // 30% utilization threshold

    if (snapshot.utilization.overall < utilizationThreshold) {
      return {
        id: this.generateOpportunityId(),
        resourceId: snapshot.resourceId,
        type: 'rightsizing',
        title: 'Rightsize under-utilized resource',
        description: `Resource is only ${(snapshot.utilization.overall * 100).toFixed(1)}% utilized. Consider downsizing.`,
        currentState: {
          configuration: { size: 'current' },
          utilization: snapshot.utilization.overall,
          cost: 1000, // Estimated current cost
          performance: 0.8
        },
        proposedState: {
          configuration: { size: 'smaller' },
          utilization: snapshot.utilization.overall / 0.7, // Target 70% utilization
          cost: 700, // Estimated new cost
          performance: 0.8
        },
        benefits: {
          cost_reduction: 300,
          performance_improvement: 0,
          efficiency_gain: 0.4,
          risk_mitigation: 0.1
        },
        implementation: {
          complexity: 'low',
          timeline: '1-2 weeks',
          steps: ['Analyze workload patterns', 'Schedule maintenance window', 'Resize resource', 'Monitor performance'],
          risks: ['Potential performance impact during peak loads'],
          dependencies: ['Maintenance window approval']
        },
        roi: {
          investment: 1000,
          annual_savings: 3600,
          payback_period_months: 3,
          net_present_value: 10800
        },
        confidence: 0.85,
        priority: 80,
        created_at: new Date()
      };
    }

    return null;
  }

  private async analyzeConsolidationOpportunity(snapshot: ResourceUtilizationSnapshot): Promise<OptimizationOpportunity | null> {
    // Analyze if multiple resources can be consolidated
    if (snapshot.utilization.overall < 0.5) {
      return {
        id: this.generateOpportunityId(),
        resourceId: snapshot.resourceId,
        type: 'consolidation',
        title: 'Consolidate with other resources',
        description: 'Low utilization suggests this resource could be consolidated with others.',
        currentState: {
          configuration: { instances: 1 },
          utilization: snapshot.utilization.overall,
          cost: 1000,
          performance: 0.8
        },
        proposedState: {
          configuration: { instances: 0.5 },
          utilization: snapshot.utilization.overall * 2,
          cost: 500,
          performance: 0.8
        },
        benefits: {
          cost_reduction: 500,
          performance_improvement: 0,
          efficiency_gain: 0.5,
          risk_mitigation: 0.2
        },
        implementation: {
          complexity: 'medium',
          timeline: '2-4 weeks',
          steps: ['Identify consolidation candidates', 'Plan migration', 'Execute consolidation', 'Validate performance'],
          risks: ['Resource contention', 'Migration complexity'],
          dependencies: ['Other low-utilization resources']
        },
        roi: {
          investment: 2000,
          annual_savings: 6000,
          payback_period_months: 4,
          net_present_value: 16000
        },
        confidence: 0.7,
        priority: 70,
        created_at: new Date()
      };
    }

    return null;
  }

  private async analyzeSchedulingOpportunity(snapshot: ResourceUtilizationSnapshot): Promise<OptimizationOpportunity | null> {
    // Analyze if resource can be scheduled on/off based on usage patterns
    const hasUsagePattern = snapshot.trends && snapshot.trends.seasonal.length > 0;
    
    if (hasUsagePattern && snapshot.utilization.overall < 0.8) {
      return {
        id: this.generateOpportunityId(),
        resourceId: snapshot.resourceId,
        type: 'scheduling',
        title: 'Implement scheduled scaling',
        description: 'Usage patterns suggest resource can be scheduled for optimal efficiency.',
        currentState: {
          configuration: { schedule: 'always_on' },
          utilization: snapshot.utilization.overall,
          cost: 1000,
          performance: 0.8
        },
        proposedState: {
          configuration: { schedule: 'business_hours' },
          utilization: snapshot.utilization.overall * 1.5,
          cost: 650,
          performance: 0.8
        },
        benefits: {
          cost_reduction: 350,
          performance_improvement: 0,
          efficiency_gain: 0.3,
          risk_mitigation: 0.1
        },
        implementation: {
          complexity: 'low',
          timeline: '1 week',
          steps: ['Configure auto-scaling rules', 'Set up monitoring', 'Test scheduling', 'Deploy to production'],
          risks: ['Startup delays', 'Scheduling conflicts'],
          dependencies: ['Auto-scaling infrastructure']
        },
        roi: {
          investment: 500,
          annual_savings: 4200,
          payback_period_months: 1.4,
          net_present_value: 12100
        },
        confidence: 0.8,
        priority: 75,
        created_at: new Date()
      };
    }

    return null;
  }

  private async generateEfficiencyInsights(
    snapshot: ResourceUtilizationSnapshot,
    efficiency: ResourceEfficiency,
    wasteAnalysis: WasteAnalysis
  ): Promise<EfficiencyInsight[]> {
    const insights: EfficiencyInsight[] = [];

    // Low efficiency insight
    if (efficiency.score < 0.6) {
      insights.push({
        id: this.generateInsightId(),
        resourceId: snapshot.resourceId,
        type: 'optimization_opportunity',
        severity: efficiency.score < 0.4 ? 'critical' : 'high',
        title: 'Low Resource Efficiency Detected',
        description: `Resource efficiency is ${(efficiency.score * 100).toFixed(1)}%, below optimal levels.`,
        impact: {
          efficiency_improvement: (0.8 - efficiency.score) * 100,
          cost_savings: wasteAnalysis.totalWaste,
          performance_gain: 20,
          risk_reduction: 15
        },
        evidence: {
          metrics: ['utilization', 'cost', 'performance'],
          timeRange: { start: new Date(Date.now() - 3600000), end: new Date() },
          data_points: snapshot.metrics.length,
          confidence: 0.85
        },
        recommendations: [
          'Review resource allocation',
          'Implement auto-scaling',
          'Consider rightsizing',
          'Optimize workload patterns'
        ],
        priority_score: efficiency.score < 0.4 ? 95 : 80,
        created_at: new Date()
      });
    }

    // Waste detection insight
    if (wasteAnalysis.totalWaste > 20) {
      insights.push({
        id: this.generateInsightId(),
        resourceId: snapshot.resourceId,
        type: 'waste_detection',
        severity: wasteAnalysis.totalWaste > 50 ? 'high' : 'medium',
        title: 'Resource Waste Detected',
        description: `${wasteAnalysis.totalWaste.toFixed(1)}% resource waste identified across multiple categories.`,
        impact: {
          efficiency_improvement: wasteAnalysis.totalWaste,
          cost_savings: wasteAnalysis.totalWaste * 10, // $10 per % waste
          performance_gain: 0,
          risk_reduction: 5
        },
        evidence: {
          metrics: ['cpu_utilization', 'memory_utilization', 'storage_utilization'],
          timeRange: { start: new Date(Date.now() - 3600000), end: new Date() },
          data_points: snapshot.metrics.length,
          confidence: 0.9
        },
        recommendations: wasteAnalysis.recommendations.map(r => r.action),
        priority_score: wasteAnalysis.totalWaste > 50 ? 90 : 70,
        created_at: new Date()
      });
    }

    // Benchmark comparison insight
    const benchmark = await this.getBenchmarks(snapshot.resourceType);
    if (efficiency.score < benchmark.industry.average * 0.8) {
      insights.push({
        id: this.generateInsightId(),
        resourceId: snapshot.resourceId,
        type: 'benchmark_comparison',
        severity: 'medium',
        title: 'Below Industry Benchmark',
        description: `Resource efficiency is ${((1 - efficiency.score / benchmark.industry.average) * 100).toFixed(1)}% below industry average.`,
        impact: {
          efficiency_improvement: (benchmark.industry.average - efficiency.score) * 100,
          cost_savings: 200,
          performance_gain: 10,
          risk_reduction: 20
        },
        evidence: {
          metrics: ['efficiency_score', 'industry_benchmark'],
          timeRange: { start: new Date(Date.now() - 86400000), end: new Date() },
          data_points: 100,
          confidence: 0.75
        },
        recommendations: [
          'Review industry best practices',
          'Implement efficiency improvements',
          'Benchmark against top performers'
        ],
        priority_score: 65,
        created_at: new Date()
      });
    }

    return insights;
  }

  private async getBenchmarks(resourceType: ResourceType): Promise<EfficiencyBenchmark> {
    let benchmark = this.benchmarks.get(resourceType);
    
    if (!benchmark) {
      // Create default benchmark
      benchmark = {
        resourceType,
        industry: {
          average: 0.75,
          p50: 0.72,
          p75: 0.82,
          p90: 0.89,
          p95: 0.93
        },
        internal: {
          average: 0.68,
          best: 0.91,
          worst: 0.42,
          variance: 0.15
        },
        target: 0.85,
        lastUpdated: new Date(),
        sampleSize: 1000
      };
      
      this.benchmarks.set(resourceType, benchmark);
    }
    
    return benchmark;
  }

  private initializeBenchmarks(): void {
    // Initialize default benchmarks for different resource types
    const resourceTypes = Object.values(ResourceType);
    
    for (const resourceType of resourceTypes) {
      this.benchmarks.set(resourceType, {
        resourceType,
        industry: {
          average: 0.75,
          p50: 0.72,
          p75: 0.82,
          p90: 0.89,
          p95: 0.93
        },
        internal: {
          average: 0.68,
          best: 0.91,
          worst: 0.42,
          variance: 0.15
        },
        target: 0.85,
        lastUpdated: new Date(),
        sampleSize: 1000
      });
    }
  }

  private startAnalysisScheduler(): void {
    this.analysisScheduler = setInterval(async () => {
      try {
        await this.runScheduledAnalysis();
      } catch (error) {
        console.error('Scheduled efficiency analysis failed:', error.message);
      }
    }, this.config.analysisInterval);
  }

  private async runScheduledAnalysis(): Promise<void> {
    // Update benchmarks
    if (this.config.enableBenchmarking) {
      await this.updateBenchmarks();
    }

    // Clean up expired insights
    await this.cleanupExpiredInsights();

    this.emit('analysisCompleted', {
      timestamp: new Date(),
      benchmarks_updated: this.config.enableBenchmarking,
      insights_cleaned: true
    });
  }

  private async updateBenchmarks(): Promise<void> {
    // Implementation for updating industry and internal benchmarks
    for (const [resourceType, benchmark] of this.benchmarks) {
      // Simulate benchmark updates
      benchmark.lastUpdated = new Date();
      benchmark.sampleSize += Math.floor(Math.random() * 100);
      
      // Small variations in benchmarks
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      benchmark.industry.average = Math.max(0.5, Math.min(0.95, benchmark.industry.average + variation));
    }
  }

  private async cleanupExpiredInsights(): Promise<void> {
    const now = new Date();
    
    for (const [resourceId, insights] of this.insights) {
      const validInsights = insights.filter(insight => 
        !insight.expires_at || insight.expires_at > now
      );
      
      if (validInsights.length !== insights.length) {
        this.insights.set(resourceId, validInsights);
      }
    }
  }

  // Storage methods
  private storeInsights(resourceId: string, insights: EfficiencyInsight[]): void {
    if (!this.insights.has(resourceId)) {
      this.insights.set(resourceId, []);
    }
    
    const existingInsights = this.insights.get(resourceId)!;
    existingInsights.push(...insights);
    
    // Keep only last 50 insights per resource
    if (existingInsights.length > 50) {
      existingInsights.splice(0, existingInsights.length - 50);
    }
  }

  private storeWasteAnalysis(resourceId: string, analysis: WasteAnalysis): void {
    if (!this.wasteAnalyses.has(resourceId)) {
      this.wasteAnalyses.set(resourceId, []);
    }
    
    const analyses = this.wasteAnalyses.get(resourceId)!;
    analyses.push(analysis);
    
    // Keep only last 10 analyses
    if (analyses.length > 10) {
      analyses.splice(0, analyses.length - 10);
    }
  }

  private storeOptimizationOpportunities(resourceId: string, opportunities: OptimizationOpportunity[]): void {
    this.optimizationOpportunities.set(resourceId, opportunities);
  }

  // Getter methods
  public getInsights(resourceId: string): EfficiencyInsight[] {
    return this.insights.get(resourceId) || [];
  }

  public getWasteAnalyses(resourceId: string): WasteAnalysis[] {
    return this.wasteAnalyses.get(resourceId) || [];
  }

  public getOptimizationOpportunities(resourceId: string): OptimizationOpportunity[] {
    return this.optimizationOpportunities.get(resourceId) || [];
  }

  public getBenchmark(resourceType: ResourceType): EfficiencyBenchmark | undefined {
    return this.benchmarks.get(resourceType);
  }

  // Helper methods
  private generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOpportunityId(): string {
    return `opportunity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateImprovementPotential(efficiency: any, benchmarks: EfficiencyBenchmark): number {
    return Math.max(0, (benchmarks.target - efficiency.overall) * 100);
  }

  private determineImprovementPriority(efficiency: any, wasteAnalysis: WasteAnalysis): 'low' | 'medium' | 'high' | 'critical' {
    if (efficiency.overall < 0.4 || wasteAnalysis.totalWaste > 60) return 'critical';
    if (efficiency.overall < 0.6 || wasteAnalysis.totalWaste > 40) return 'high';
    if (efficiency.overall < 0.75 || wasteAnalysis.totalWaste > 20) return 'medium';
    return 'low';
  }

  private estimateEffort(opportunities: OptimizationOpportunity[]): 'low' | 'medium' | 'high' {
    if (opportunities.length === 0) return 'low';
    
    const complexities = opportunities.map(o => o.implementation.complexity);
    const highComplexityCount = complexities.filter(c => c === 'high').length;
    const mediumComplexityCount = complexities.filter(c => c === 'medium').length;
    
    if (highComplexityCount > 0) return 'high';
    if (mediumComplexityCount > opportunities.length / 2) return 'medium';
    return 'low';
  }

  private async getCostData(resourceId: string): Promise<ResourceCost | null> {
    // Implementation would fetch actual cost data
    return null;
  }

  public async shutdown(): Promise<void> {
    if (this.analysisScheduler) {
      clearInterval(this.analysisScheduler);
    }
    
    this.emit('shutdown');
  }
}
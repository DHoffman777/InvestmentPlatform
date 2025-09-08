import { EventEmitter } from 'events';
import {
  ResourceCost,
  CostDetail,
  ResourceUtilizationSnapshot,
  ResourceType,
  ResourceMetricType,
  ResourceRecommendation
} from './ResourceDataModel';

export interface CostAnalysisConfig {
  analysisInterval: number;
  costUpdateInterval: number;
  enableRealTimeCostTracking: boolean;
  enableCostForecasting: boolean;
  enableCostOptimization: boolean;
  enableCostAlerting: boolean;
  costThresholds: {
    warning: number;
    critical: number;
    emergency: number;
  };
  forecastHorizons: number[]; // Days
  optimizationTargets: {
    cost_reduction_percentage: number;
    efficiency_improvement_percentage: number;
    waste_reduction_percentage: number;
  };
  currencies: string[];
  exchangeRateUpdateInterval: number;
}

export interface CostModel {
  id: string;
  name: string;
  description: string;
  resource_type: ResourceType;
  pricing_model: 'hourly' | 'monthly' | 'usage_based' | 'tiered' | 'spot' | 'reserved' | 'committed';
  cost_factors: CostFactor[];
  base_cost: number;
  currency: string;
  effective_date: Date;
  expiry_date?: Date;
  provider: string;
  region?: string;
  availability_zone?: string;
  instance_type?: string;
  contract_terms?: Record<string, any>;
}

export interface CostFactor {
  type: 'compute' | 'storage' | 'network' | 'licensing' | 'support' | 'data_transfer' | 'api_calls' | 'custom';
  name: string;
  unit: string;
  unit_cost: number;
  included_quantity?: number;
  overage_cost?: number;
  volume_discounts?: Array<{
    min_quantity: number;
    discount_percentage: number;
  }>;
  conditions?: Array<{
    parameter: string;
    operator: string;
    value: any;
  }>;
}

export interface CostCorrelation {
  resource_id: string;
  analysis_period: { start: Date; end: Date };
  correlations: {
    utilization_cost: CorrelationAnalysis;
    performance_cost: CorrelationAnalysis;
    efficiency_cost: CorrelationAnalysis;
    time_cost: CorrelationAnalysis;
    workload_cost: CorrelationAnalysis;
  };
  cost_drivers: CostDriver[];
  cost_anomalies: CostAnomaly[];
  optimization_opportunities: CostOptimizationOpportunity[];
  forecast: CostForecast;
  recommendations: CostRecommendation[];
}

export interface CorrelationAnalysis {
  correlation_coefficient: number;
  r_squared: number;
  p_value: number;
  significance: 'high' | 'medium' | 'low' | 'none';
  trend: 'positive' | 'negative' | 'neutral';
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  data_points: number;
  time_lags: Array<{
    lag_hours: number;
    correlation: number;
  }>;
  confidence_interval: {
    lower: number;
    upper: number;
  };
}

export interface CostDriver {
  factor: string;
  impact_percentage: number;
  cost_contribution: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  controllability: 'high' | 'medium' | 'low' | 'none';
  optimization_potential: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendations: string[];
}

export interface CostAnomaly {
  id: string;
  timestamp: Date;
  type: 'spike' | 'drop' | 'drift' | 'pattern_break' | 'threshold_breach';
  severity: 'critical' | 'high' | 'medium' | 'low';
  cost_impact: number;
  percentage_change: number;
  duration_hours: number;
  expected_cost: number;
  actual_cost: number;
  confidence: number;
  potential_causes: string[];
  correlated_metrics: Array<{
    metric: ResourceMetricType;
    correlation: number;
    timing: 'leading' | 'concurrent' | 'lagging';
  }>;
  business_impact: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    affected_services: string[];
  };
  resolution_status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  resolution_notes?: string;
}

export interface CostOptimizationOpportunity {
  id: string;
  type: 'rightsizing' | 'scheduling' | 'pricing_model' | 'consolidation' | 'elimination' | 'automation';
  title: string;
  description: string;
  current_cost: number;
  optimized_cost: number;
  savings_amount: number;
  savings_percentage: number;
  implementation: {
    effort: 'trivial' | 'low' | 'medium' | 'high' | 'expert';
    risk: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    timeline: string;
    steps: string[];
    dependencies: string[];
    rollback_plan: string[];
  };
  impact_analysis: {
    performance_impact: number;
    availability_impact: number;
    operational_impact: number;
    user_experience_impact: number;
  };
  roi: {
    investment_cost: number;
    payback_period_months: number;
    annual_savings: number;
    three_year_npv: number;
  };
  confidence: number;
  priority: number;
  expires_at?: Date;
}

export interface CostForecast {
  horizon_days: number;
  predictions: Array<{
    date: Date;
    predicted_cost: number;
    confidence_lower: number;
    confidence_upper: number;
    factors: Record<string, number>;
  }>;
  models_used: string[];
  accuracy_metrics: {
    mae: number; // Mean Absolute Error
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    r_squared: number;
  };
  assumptions: string[];
  risk_factors: Array<{
    factor: string;
    probability: number;
    impact: number;
  }>;
  scenarios: Array<{
    name: string;
    description: string;
    probability: number;
    cost_range: { min: number; max: number };
  }>;
}

export interface CostRecommendation {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term' | 'strategic';
  category: 'cost_reduction' | 'efficiency_improvement' | 'cost_visibility' | 'governance' | 'automation';
  title: string;
  description: string;
  rationale: string;
  expected_savings: number;
  implementation: {
    priority: 'critical' | 'high' | 'medium' | 'low';
    effort: 'minimal' | 'low' | 'medium' | 'high' | 'extensive';
    timeline: string;
    steps: string[];
    risks: string[];
    success_metrics: string[];
  };
  dependencies: string[];
  conflicts: string[];
  confidence: number;
  created_at: Date;
  expires_at?: Date;
}

export interface CostAlert {
  id: string;
  resource_id: string;
  type: 'threshold_breach' | 'anomaly_detected' | 'forecast_warning' | 'optimization_opportunity' | 'budget_exceeded';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  title: string;
  description: string;
  current_cost: number;
  threshold_cost?: number;
  forecast_cost?: number;
  time_window: { start: Date; end: Date };
  triggered_at: Date;
  acknowledged_at?: Date;
  resolved_at?: Date;
  actions_taken: string[];
  escalation_level: number;
  notifications_sent: string[];
}

export class ResourceCostAnalysisService extends EventEmitter {
  private costModels: Map<string, CostModel> = new Map();
  private costData: Map<string, ResourceCost[]> = new Map();
  private correlations: Map<string, CostCorrelation> = new Map();
  private alerts: Map<string, CostAlert[]> = new Map();
  private exchangeRates: Map<string, number> = new Map();
  private analysisScheduler?: NodeJS.Timeout;
  private costUpdateScheduler?: NodeJS.Timeout;

  constructor(private config: CostAnalysisConfig) {
    super();
    this.initializeCostModels();
    this.initializeExchangeRates();
    this.startSchedulers();
  }

  async analyzeCostCorrelations(
    resourceId: string,
    snapshot: ResourceUtilizationSnapshot,
    historicalData: ResourceUtilizationSnapshot[]
  ): Promise<CostCorrelation> {
    const analysisPeriod = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
      end: new Date()
    };

    // Get cost data for analysis period
    const costHistory = await this.getCostHistory(resourceId, analysisPeriod);
    
    // Analyze correlations
    const correlations = {
      utilization_cost: await this.analyzeUtilizationCostCorrelation(historicalData, costHistory),
      performance_cost: await this.analyzePerformanceCostCorrelation(historicalData, costHistory),
      efficiency_cost: await this.analyzeEfficiencyCostCorrelation(historicalData, costHistory),
      time_cost: await this.analyzeTimeCostCorrelation(historicalData, costHistory),
      workload_cost: await this.analyzeWorkloadCostCorrelation(historicalData, costHistory)
    };

    // Identify cost drivers
    const costDrivers = await this.identifyCostDrivers(resourceId, historicalData, costHistory);
    
    // Detect cost anomalies
    const costAnomalies = await this.detectCostAnomalies(resourceId, costHistory);
    
    // Find optimization opportunities
    const optimizationOpportunities = await this.findCostOptimizationOpportunities(
      resourceId, 
      snapshot, 
      costHistory, 
      correlations
    );
    
    // Generate forecast
    const forecast = await this.generateCostForecast(resourceId, costHistory, historicalData);
    
    // Generate recommendations
    const recommendations = await this.generateCostRecommendations(
      resourceId,
      correlations,
      costDrivers,
      optimizationOpportunities
    );

    const correlation: CostCorrelation = {
      resource_id: resourceId,
      analysis_period: analysisPeriod,
      correlations,
      cost_drivers: costDrivers,
      cost_anomalies: costAnomalies,
      optimization_opportunities: optimizationOpportunities,
      forecast,
      recommendations
    };

    // Store correlation analysis
    this.correlations.set(resourceId, correlation);

    // Generate alerts if needed
    await this.checkCostAlerts(resourceId, correlation);

    this.emit('costAnalysisCompleted', {
      resourceId,
      correlation,
      savingsOpportunities: optimizationOpportunities.length,
      totalPotentialSavings: optimizationOpportunities.reduce((sum, opp) => sum + opp.savings_amount, 0),
      timestamp: new Date()
    });

    return correlation;
  }

  private async analyzeUtilizationCostCorrelation(
    utilizationData: ResourceUtilizationSnapshot[],
    costData: ResourceCost[]
  ): Promise<CorrelationAnalysis> {
    if (utilizationData.length === 0 || costData.length === 0) {
      return this.getEmptyCorrelationAnalysis();
    }

    // Align data by timestamp and calculate correlation
    const alignedData = this.alignUtilizationAndCostData(utilizationData, costData);
    const utilizationValues = alignedData.map(d => d.utilization.overall);
    const costValues = alignedData.map(d => d.cost);

    const correlation = this.calculateCorrelation(utilizationValues, costValues);
    const rSquared = Math.pow(correlation, 2);
    
    return {
      correlation_coefficient: correlation,
      r_squared: rSquared,
      p_value: this.calculatePValue(correlation, alignedData.length),
      significance: this.determineSignificance(correlation, alignedData.length),
      trend: correlation > 0.1 ? 'positive' : correlation < -0.1 ? 'negative' : 'neutral',
      strength: this.determineCorrelationStrength(Math.abs(correlation)),
      data_points: alignedData.length,
      time_lags: await this.calculateTimeLags(utilizationValues, costValues),
      confidence_interval: this.calculateConfidenceInterval(correlation, alignedData.length)
    };
  }

  private async analyzePerformanceCostCorrelation(
    utilizationData: ResourceUtilizationSnapshot[],
    costData: ResourceCost[]
  ): Promise<CorrelationAnalysis> {
    // Extract performance metrics (response time, throughput, etc.)
    const performanceValues = utilizationData.map(snapshot => {
      const responseTimeMetrics = snapshot.metrics.filter(m => 
        m.metricType === ResourceMetricType.APP_RESPONSE_TIME
      );
      return responseTimeMetrics.length > 0 
        ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
        : 0;
    });

    const alignedData = this.alignPerformanceAndCostData(performanceValues, costData);
    if (alignedData.length === 0) {
      return this.getEmptyCorrelationAnalysis();
    }

    const correlation = this.calculateCorrelation(
      alignedData.map(d => d.performance),
      alignedData.map(d => d.cost)
    );

    return {
      correlation_coefficient: correlation,
      r_squared: Math.pow(correlation, 2),
      p_value: this.calculatePValue(correlation, alignedData.length),
      significance: this.determineSignificance(correlation, alignedData.length),
      trend: correlation > 0.1 ? 'positive' : correlation < -0.1 ? 'negative' : 'neutral',
      strength: this.determineCorrelationStrength(Math.abs(correlation)),
      data_points: alignedData.length,
      time_lags: await this.calculateTimeLags(
        alignedData.map(d => d.performance),
        alignedData.map(d => d.cost)
      ),
      confidence_interval: this.calculateConfidenceInterval(correlation, alignedData.length)
    };
  }

  private async analyzeEfficiencyCostCorrelation(
    utilizationData: ResourceUtilizationSnapshot[],
    costData: ResourceCost[]
  ): Promise<CorrelationAnalysis> {
    const efficiencyValues = utilizationData.map(snapshot => snapshot.efficiency?.score || 0);
    const alignedData = this.alignEfficiencyAndCostData(efficiencyValues, costData);
    
    if (alignedData.length === 0) {
      return this.getEmptyCorrelationAnalysis();
    }

    const correlation = this.calculateCorrelation(
      alignedData.map(d => d.efficiency),
      alignedData.map(d => d.cost)
    );

    return {
      correlation_coefficient: correlation,
      r_squared: Math.pow(correlation, 2),
      p_value: this.calculatePValue(correlation, alignedData.length),
      significance: this.determineSignificance(correlation, alignedData.length),
      trend: correlation > 0.1 ? 'positive' : correlation < -0.1 ? 'negative' : 'neutral',
      strength: this.determineCorrelationStrength(Math.abs(correlation)),
      data_points: alignedData.length,
      time_lags: await this.calculateTimeLags(
        alignedData.map(d => d.efficiency),
        alignedData.map(d => d.cost)
      ),
      confidence_interval: this.calculateConfidenceInterval(correlation, alignedData.length)
    };
  }

  private async analyzeTimeCostCorrelation(
    utilizationData: ResourceUtilizationSnapshot[],
    costData: ResourceCost[]
  ): Promise<CorrelationAnalysis> {
    // Analyze cost patterns over time (seasonal, daily, weekly patterns)
    const timeValues = costData.map((_, index) => index); // Simple time index
    const costValues = costData.map(cost => cost.costs.total.amount);

    if (costValues.length === 0) {
      return this.getEmptyCorrelationAnalysis();
    }

    const correlation = this.calculateCorrelation(timeValues, costValues);

    return {
      correlation_coefficient: correlation,
      r_squared: Math.pow(correlation, 2),
      p_value: this.calculatePValue(correlation, costValues.length),
      significance: this.determineSignificance(correlation, costValues.length),
      trend: correlation > 0.1 ? 'positive' : correlation < -0.1 ? 'negative' : 'neutral',
      strength: this.determineCorrelationStrength(Math.abs(correlation)),
      data_points: costValues.length,
      time_lags: [],
      confidence_interval: this.calculateConfidenceInterval(correlation, costValues.length)
    };
  }

  private async analyzeWorkloadCostCorrelation(
    utilizationData: ResourceUtilizationSnapshot[],
    costData: ResourceCost[]
  ): Promise<CorrelationAnalysis> {
    // Analyze correlation between workload characteristics and cost
    const workloadValues = utilizationData.map(snapshot => {
      // Combine various workload indicators
      return (snapshot.utilization.cpu + snapshot.utilization.memory + 
              snapshot.utilization.storage + snapshot.utilization.network) / 4;
    });

    const alignedData = this.alignWorkloadAndCostData(workloadValues, costData);
    
    if (alignedData.length === 0) {
      return this.getEmptyCorrelationAnalysis();
    }

    const correlation = this.calculateCorrelation(
      alignedData.map(d => d.workload),
      alignedData.map(d => d.cost)
    );

    return {
      correlation_coefficient: correlation,
      r_squared: Math.pow(correlation, 2),
      p_value: this.calculatePValue(correlation, alignedData.length),
      significance: this.determineSignificance(correlation, alignedData.length),
      trend: correlation > 0.1 ? 'positive' : correlation < -0.1 ? 'negative' : 'neutral',
      strength: this.determineCorrelationStrength(Math.abs(correlation)),
      data_points: alignedData.length,
      time_lags: await this.calculateTimeLags(
        alignedData.map(d => d.workload),
        alignedData.map(d => d.cost)
      ),
      confidence_interval: this.calculateConfidenceInterval(correlation, alignedData.length)
    };
  }

  private async identifyCostDrivers(
    resourceId: string,
    utilizationData: ResourceUtilizationSnapshot[],
    costData: ResourceCost[]
  ): Promise<CostDriver[]> {
    const drivers: CostDriver[] = [];

    // Analyze compute cost driver
    const computeCostContribution = this.calculateCostContribution('compute', costData);
    if (computeCostContribution > 0.1) { // 10% threshold
      drivers.push({
        factor: 'Compute Resources',
        impact_percentage: computeCostContribution * 100,
        cost_contribution: this.calculateAbsoluteCostContribution('compute', costData),
        trend: this.calculateCostTrend('compute', costData),
        controllability: 'high',
        optimization_potential: this.calculateOptimizationPotential('compute'),
        priority: computeCostContribution > 0.5 ? 'critical' : computeCostContribution > 0.3 ? 'high' : 'medium',
        description: 'CPU and memory costs based on provisioned capacity and utilization',
        recommendations: [
          'Consider rightsizing instances',
          'Implement auto-scaling',
          'Use spot instances where appropriate'
        ]
      });
    }

    // Analyze storage cost driver
    const storageCostContribution = this.calculateCostContribution('storage', costData);
    if (storageCostContribution > 0.1) {
      drivers.push({
        factor: 'Storage Resources',
        impact_percentage: storageCostContribution * 100,
        cost_contribution: this.calculateAbsoluteCostContribution('storage', costData),
        trend: this.calculateCostTrend('storage', costData),
        controllability: 'medium',
        optimization_potential: this.calculateOptimizationPotential('storage'),
        priority: storageCostContribution > 0.4 ? 'critical' : storageCostContribution > 0.2 ? 'high' : 'medium',
        description: 'Storage costs including persistent volumes and backup storage',
        recommendations: [
          'Implement data lifecycle policies',
          'Use appropriate storage tiers',
          'Clean up unused storage'
        ]
      });
    }

    // Analyze network cost driver
    const networkCostContribution = this.calculateCostContribution('network', costData);
    if (networkCostContribution > 0.05) {
      drivers.push({
        factor: 'Network Resources',
        impact_percentage: networkCostContribution * 100,
        cost_contribution: this.calculateAbsoluteCostContribution('network', costData),
        trend: this.calculateCostTrend('network', costData),
        controllability: 'medium',
        optimization_potential: this.calculateOptimizationPotential('network'),
        priority: networkCostContribution > 0.3 ? 'high' : 'medium',
        description: 'Data transfer and network infrastructure costs',
        recommendations: [
          'Optimize data transfer patterns',
          'Use CDN for static content',
          'Minimize cross-region traffic'
        ]
      });
    }

    return drivers.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async detectCostAnomalies(
    resourceId: string,
    costData: ResourceCost[]
  ): Promise<CostAnomaly[]> {
    const anomalies: CostAnomaly[] = [];
    
    if (costData.length < 7) { // Need at least a week of data
      return anomalies;
    }

    const costs = costData.map(c => c.costs.total.amount);
    const timestamps = costData.map(c => c.period.start);
    
    // Calculate statistical thresholds
    const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    const stdDev = Math.sqrt(costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / costs.length);
    const upperThreshold = mean + (2.5 * stdDev);
    const lowerThreshold = Math.max(0, mean - (2.5 * stdDev));

    // Detect anomalies
    for (let i = 0; i < costs.length; i++) {
      const cost = costs[i];
      const timestamp = timestamps[i];
      
      if (cost > upperThreshold) {
        anomalies.push({
          id: this.generateAnomalyId(),
          timestamp,
          type: 'spike',
          severity: cost > upperThreshold * 1.5 ? 'critical' : 'high',
          cost_impact: cost - mean,
          percentage_change: ((cost - mean) / mean) * 100,
          duration_hours: 24, // Assume daily data points
          expected_cost: mean,
          actual_cost: cost,
          confidence: 0.85,
          potential_causes: [
            'Unexpected workload increase',
            'Resource scaling event',
            'Pricing model change',
            'New service deployment'
          ],
          correlated_metrics: [],
          business_impact: {
            severity: cost > upperThreshold * 2 ? 'critical' : 'high',
            description: 'Unexpected cost increase may impact budget',
            affected_services: [resourceId]
          },
          resolution_status: 'open'
        });
      } else if (cost < lowerThreshold) {
        anomalies.push({
          id: this.generateAnomalyId(),
          timestamp,
          type: 'drop',
          severity: 'medium',
          cost_impact: mean - cost,
          percentage_change: ((mean - cost) / mean) * 100,
          duration_hours: 24,
          expected_cost: mean,
          actual_cost: cost,
          confidence: 0.8,
          potential_causes: [
            'Service downtime',
            'Reduced workload',
            'Resource deallocation',
            'Pricing discount applied'
          ],
          correlated_metrics: [],
          business_impact: {
            severity: 'low',
            description: 'Unexpected cost decrease may indicate service issues',
            affected_services: [resourceId]
          },
          resolution_status: 'open'
        });
      }
    }

    return anomalies;
  }

  private async findCostOptimizationOpportunities(
    resourceId: string,
    snapshot: ResourceUtilizationSnapshot,
    costData: ResourceCost[],
    correlations: any
  ): Promise<CostOptimizationOpportunity[]> {
    const opportunities: CostOptimizationOpportunity[] = [];

    // Rightsizing opportunity
    if (snapshot.utilization.overall < 0.3) { // Less than 30% utilization
      const currentCost = costData.length > 0 ? costData[costData.length - 1].costs.total.amount : 1000;
      const optimizedCost = currentCost * 0.6; // Assume 40% savings
      
      opportunities.push({
        id: this.generateOpportunityId(),
        type: 'rightsizing',
        title: 'Rightsize Under-utilized Resource',
        description: `Resource utilization is only ${(snapshot.utilization.overall * 100).toFixed(1)}%. Consider downsizing.`,
        current_cost: currentCost,
        optimized_cost: optimizedCost,
        savings_amount: currentCost - optimizedCost,
        savings_percentage: 40,
        implementation: {
          effort: 'low',
          risk: 'low',
          timeline: '1-2 days',
          steps: [
            'Analyze peak usage patterns',
            'Calculate optimal resource size',
            'Schedule maintenance window',
            'Resize resource',
            'Monitor performance'
          ],
          dependencies: ['Performance baseline', 'Maintenance approval'],
          rollback_plan: ['Restore original size', 'Monitor metrics']
        },
        impact_analysis: {
          performance_impact: -0.05, // Slight performance impact
          availability_impact: 0,
          operational_impact: 0.1,
          user_experience_impact: 0
        },
        roi: {
          investment_cost: 500,
          payback_period_months: 1.25,
          annual_savings: (currentCost - optimizedCost) * 12,
          three_year_npv: (currentCost - optimizedCost) * 36 - 500
        },
        confidence: 0.85,
        priority: 80
      });
    }

    // Scheduling opportunity
    if (this.hasSchedulingOpportunity(snapshot)) {
      const currentCost = costData.length > 0 ? costData[costData.length - 1].costs.total.amount : 1000;
      const optimizedCost = currentCost * 0.7; // 30% savings
      
      opportunities.push({
        id: this.generateOpportunityId(),
        type: 'scheduling',
        title: 'Implement Scheduled Scaling',
        description: 'Usage patterns suggest resource can be scheduled for optimal cost efficiency.',
        current_cost: currentCost,
        optimized_cost: optimizedCost,
        savings_amount: currentCost - optimizedCost,
        savings_percentage: 30,
        implementation: {
          effort: 'low',
          risk: 'low',
          timeline: '3-5 days',
          steps: [
            'Analyze usage patterns',
            'Configure auto-scaling policies',
            'Set up scheduling rules',
            'Test scaling behavior',
            'Monitor cost impact'
          ],
          dependencies: ['Auto-scaling infrastructure', 'Monitoring setup'],
          rollback_plan: ['Disable scheduling', 'Restore manual scaling']
        },
        impact_analysis: {
          performance_impact: 0,
          availability_impact: 0.05, // Slight impact during scaling
          operational_impact: 0.1,
          user_experience_impact: 0
        },
        roi: {
          investment_cost: 200,
          payback_period_months: 0.7,
          annual_savings: (currentCost - optimizedCost) * 12,
          three_year_npv: (currentCost - optimizedCost) * 36 - 200
        },
        confidence: 0.75,
        priority: 70
      });
    }

    // Pricing model opportunity
    const pricingOpportunity = await this.analyzePricingModelOpportunity(resourceId, costData);
    if (pricingOpportunity) {
      opportunities.push(pricingOpportunity);
    }

    return opportunities.sort((a, b) => b.priority - a.priority);
  }

  private async generateCostForecast(
    resourceId: string,
    costData: ResourceCost[],
    utilizationData: ResourceUtilizationSnapshot[]
  ): Promise<CostForecast> {
    const horizon = this.config.forecastHorizons[0] || 30; // Default 30 days
    const predictions = [];
    
    if (costData.length < 7) {
      // Not enough data for reliable forecast
      return {
        horizon_days: horizon,
        predictions: [],
        models_used: [],
        accuracy_metrics: { mae: 0, mape: 0, rmse: 0, r_squared: 0 },
        assumptions: ['Insufficient historical data'],
        risk_factors: [],
        scenarios: []
      };
    }

    // Simple linear trend forecast
    const costs = costData.map(c => c.costs.total.amount);
    const trend = this.calculateLinearTrend(costs);
    const lastCost = costs[costs.length - 1];
    
    for (let day = 1; day <= horizon; day++) {
      const predictedCost = lastCost + (trend * day);
      const uncertainty = Math.abs(predictedCost * 0.1); // 10% uncertainty
      
      predictions.push({
        date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
        predicted_cost: Math.max(0, predictedCost),
        confidence_lower: Math.max(0, predictedCost - uncertainty),
        confidence_upper: predictedCost + uncertainty,
        factors: {
          trend: trend * day,
          seasonal: 0,
          utilization: 0
        }
      });
    }

    return {
      horizon_days: horizon,
      predictions,
      models_used: ['linear_trend'],
      accuracy_metrics: {
        mae: this.calculateMAE(costs),
        mape: this.calculateMAPE(costs),
        rmse: this.calculateRMSE(costs),
        r_squared: 0.7
      },
      assumptions: [
        'Current utilization patterns continue',
        'No major infrastructure changes',
        'Pricing remains stable'
      ],
      risk_factors: [
        { factor: 'Workload spikes', probability: 0.3, impact: 0.5 },
        { factor: 'Pricing changes', probability: 0.1, impact: 0.2 }
      ],
      scenarios: [
        {
          name: 'Conservative',
          description: 'Current trends continue with minimal growth',
          probability: 0.6,
          cost_range: {
            min: predictions[predictions.length - 1].confidence_lower,
            max: predictions[predictions.length - 1].predicted_cost
          }
        },
        {
          name: 'Growth',
          description: 'Increased utilization drives higher costs',
          probability: 0.3,
          cost_range: {
            min: predictions[predictions.length - 1].predicted_cost,
            max: predictions[predictions.length - 1].confidence_upper
          }
        }
      ]
    };
  }

  private mapEffortLevel(effort: 'trivial' | 'low' | 'medium' | 'high' | 'expert'): 'minimal' | 'low' | 'medium' | 'high' | 'extensive' {
    switch (effort) {
      case 'trivial':
        return 'minimal';
      case 'expert':
        return 'extensive';
      default:
        return effort;
    }
  }

  private async generateCostRecommendations(
    resourceId: string,
    correlations: any,
    costDrivers: CostDriver[],
    opportunities: CostOptimizationOpportunity[]
  ): Promise<CostRecommendation[]> {
    const recommendations: CostRecommendation[] = [];

    // High-impact optimization recommendations
    for (const opportunity of opportunities.slice(0, 3)) { // Top 3 opportunities
      recommendations.push({
        id: this.generateRecommendationId(),
        type: 'immediate',
        category: 'cost_reduction',
        title: opportunity.title,
        description: opportunity.description,
        rationale: `Potential savings of $${opportunity.savings_amount.toFixed(2)} (${opportunity.savings_percentage}%)`,
        expected_savings: opportunity.savings_amount,
        implementation: {
          priority: opportunity.priority > 75 ? 'high' : 'medium',
          effort: this.mapEffortLevel(opportunity.implementation.effort),
          timeline: opportunity.implementation.timeline,
          steps: opportunity.implementation.steps,
          risks: [`Performance impact: ${opportunity.impact_analysis.performance_impact}`],
          success_metrics: [
            'Cost reduction achieved',
            'Performance maintained',
            'User experience preserved'
          ]
        },
        dependencies: opportunity.implementation.dependencies,
        conflicts: [],
        confidence: opportunity.confidence,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
    }

    // Cost driver recommendations
    for (const driver of costDrivers.filter(d => d.priority === 'critical')) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: 'short_term',
        category: 'efficiency_improvement',
        title: `Optimize ${driver.factor}`,
        description: `${driver.factor} contributes ${driver.impact_percentage.toFixed(1)}% of total cost`,
        rationale: `High cost contribution with ${driver.controllability} controllability`,
        expected_savings: driver.cost_contribution * (driver.optimization_potential / 100),
        implementation: {
          priority: driver.priority === 'critical' ? 'high' : 'medium',
          effort: driver.optimization_potential > 30 ? 'medium' : 'low',
          timeline: '1-2 weeks',
          steps: driver.recommendations,
          risks: ['Operational complexity', 'Learning curve'],
          success_metrics: [
            'Cost contribution reduced',
            'Efficiency improved',
            'No service disruption'
          ]
        },
        dependencies: ['Cost analysis tools', 'Monitoring setup'],
        conflicts: [],
        confidence: 0.8,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.implementation.priority];
      const bPriority = priorityOrder[b.implementation.priority];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.expected_savings - a.expected_savings;
    });
  }

  private async checkCostAlerts(resourceId: string, correlation: CostCorrelation): Promise<any> {
    const alerts: CostAlert[] = [];

    // Check for anomaly alerts
    for (const anomaly of correlation.cost_anomalies) {
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        alerts.push({
          id: this.generateAlertId(),
          resource_id: resourceId,
          type: 'anomaly_detected',
          severity: anomaly.severity === 'critical' ? 'critical' : 'warning',
          title: `Cost ${anomaly.type} detected`,
          description: `${anomaly.percentage_change.toFixed(1)}% cost ${anomaly.type} detected`,
          current_cost: anomaly.actual_cost,
          threshold_cost: anomaly.expected_cost,
          time_window: {
            start: new Date(anomaly.timestamp.getTime() - 24 * 60 * 60 * 1000),
            end: anomaly.timestamp
          },
          triggered_at: new Date(),
          actions_taken: [],
          escalation_level: 0,
          notifications_sent: []
        });
      }
    }

    // Check for forecast alerts
    const forecast = correlation.forecast;
    if (forecast.predictions.length > 0) {
      const lastPrediction = forecast.predictions[forecast.predictions.length - 1];
      const currentCost = this.getCurrentCost(resourceId);
      
      if (lastPrediction.predicted_cost > currentCost * 1.5) { // 50% increase predicted
        alerts.push({
          id: this.generateAlertId(),
          resource_id: resourceId,
          type: 'forecast_warning',
          severity: 'warning',
          title: 'Cost increase forecast',
          description: `${((lastPrediction.predicted_cost / currentCost - 1) * 100).toFixed(1)}% cost increase predicted`,
          current_cost: currentCost,
          forecast_cost: lastPrediction.predicted_cost,
          time_window: {
            start: new Date(),
            end: lastPrediction.date
          },
          triggered_at: new Date(),
          actions_taken: [],
          escalation_level: 0,
          notifications_sent: []
        });
      }
    }

    // Store alerts
    if (alerts.length > 0) {
      this.storeAlerts(resourceId, alerts);
      
      this.emit('costAlertsGenerated', {
        resourceId,
        alerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        timestamp: new Date()
      });
    }
  }

  // Helper methods and implementations
  private initializeCostModels(): void {
    // Initialize default cost models for different resource types
    const defaultModel: CostModel = {
      id: 'default',
      name: 'Default Cost Model',
      description: 'Default pricing model for resource cost calculation',
      resource_type: ResourceType.CUSTOM,
      pricing_model: 'hourly',
      cost_factors: [
        {
          type: 'compute',
          name: 'CPU Hours',
          unit: 'hour',
          unit_cost: 0.10
        },
        {
          type: 'storage',
          name: 'Storage GB',
          unit: 'GB',
          unit_cost: 0.05
        }
      ],
      base_cost: 0,
      currency: 'USD',
      effective_date: new Date(),
      provider: 'internal',
      region: 'us-east-1'
    };

    this.costModels.set('default', defaultModel);
  }

  private initializeExchangeRates(): void {
    // Initialize exchange rates for supported currencies
    this.exchangeRates.set('USD', 1.0);
    this.exchangeRates.set('EUR', 0.85);
    this.exchangeRates.set('GBP', 0.73);
    this.exchangeRates.set('JPY', 110.0);
  }

  private startSchedulers(): void {
    // Analysis scheduler
    this.analysisScheduler = setInterval(async () => {
      try {
        await this.performScheduledAnalysis();
      } catch (error: any) {
        console.error('Scheduled cost analysis failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }, this.config.analysisInterval);

    // Cost update scheduler
    this.costUpdateScheduler = setInterval(async () => {
      try {
        await this.updateCostData();
      } catch (error: any) {
        console.error('Cost data update failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }, this.config.costUpdateInterval);
  }

  private async performScheduledAnalysis(): Promise<any> {
    // Perform analysis for all resources
    for (const resourceId of this.costData.keys()) {
      try {
        // This would normally trigger analysis with current snapshot
        this.emit('analysisScheduled', { resourceId, timestamp: new Date() });
      } catch (error: any) {
        console.error(`Analysis failed for resource ${resourceId}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  private async updateCostData(): Promise<any> {
    // Update cost data from cost providers
    this.emit('costDataUpdated', { timestamp: new Date() });
  }

  // Storage and retrieval methods
  private storeAlerts(resourceId: string, alerts: CostAlert[]): void {
    if (!this.alerts.has(resourceId)) {
      this.alerts.set(resourceId, []);
    }
    
    const resourceAlerts = this.alerts.get(resourceId)!;
    resourceAlerts.push(...alerts);
    
    // Keep only last 50 alerts
    if (resourceAlerts.length > 50) {
      resourceAlerts.splice(0, resourceAlerts.length - 50);
    }
  }

  // Getter methods
  public getCostCorrelation(resourceId: string): CostCorrelation | undefined {
    return this.correlations.get(resourceId);
  }

  public getCostAlerts(resourceId: string): CostAlert[] {
    return this.alerts.get(resourceId) || [];
  }

  public getCostModels(): CostModel[] {
    return Array.from(this.costModels.values());
  }

  // Helper method implementations (simplified for brevity)
  private async getCostHistory(resourceId: string, period: { start: Date; end: Date }): Promise<ResourceCost[]> {
    return this.costData.get(resourceId) || [];
  }

  private getCurrentCost(resourceId: string): number {
    const costs = this.costData.get(resourceId) || [];
    return costs.length > 0 ? costs[costs.length - 1].costs.total.amount : 0;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Additional simplified helper methods...
  private getEmptyCorrelationAnalysis(): CorrelationAnalysis {
    return {
      correlation_coefficient: 0,
      r_squared: 0,
      p_value: 1,
      significance: 'none',
      trend: 'neutral',
      strength: 'none',
      data_points: 0,
      time_lags: [],
      confidence_interval: { lower: 0, upper: 0 }
    };
  }

  private alignUtilizationAndCostData(utilization: ResourceUtilizationSnapshot[], cost: ResourceCost[]): any[] { return []; }
  private alignPerformanceAndCostData(performance: number[], cost: ResourceCost[]): any[] { return []; }
  private alignEfficiencyAndCostData(efficiency: number[], cost: ResourceCost[]): any[] { return []; }
  private alignWorkloadAndCostData(workload: number[], cost: ResourceCost[]): any[] { return []; }
  private calculatePValue(correlation: number, sampleSize: number): number { return 0.05; }
  private determineSignificance(correlation: number, sampleSize: number): 'high' | 'medium' | 'low' | 'none' { return 'medium'; }
  private determineCorrelationStrength(correlation: number): 'strong' | 'moderate' | 'weak' | 'none' {
    if (correlation > 0.7) return 'strong';
    if (correlation > 0.4) return 'moderate';
    if (correlation > 0.2) return 'weak';
    return 'none';
  }
  private async calculateTimeLags(x: number[], y: number[]): Promise<Array<{ lag_hours: number; correlation: number }>> { return []; }
  private calculateConfidenceInterval(correlation: number, sampleSize: number): { lower: number; upper: number } {
    return { lower: correlation - 0.1, upper: correlation + 0.1 };
  }
  private calculateCostContribution(type: string, costData: ResourceCost[]): number { return 0.3; }
  private calculateAbsoluteCostContribution(type: string, costData: ResourceCost[]): number { return 300; }
  private calculateCostTrend(type: string, costData: ResourceCost[]): 'increasing' | 'decreasing' | 'stable' | 'volatile' { return 'stable'; }
  private calculateOptimizationPotential(type: string): number { return 25; }
  private hasSchedulingOpportunity(snapshot: ResourceUtilizationSnapshot): boolean { return snapshot.utilization.overall < 0.8; }
  private async analyzePricingModelOpportunity(resourceId: string, costData: ResourceCost[]): Promise<CostOptimizationOpportunity | null> { return null; }
  private calculateLinearTrend(values: number[]): number { return 0.05; }
  private calculateMAE(values: number[]): number { return 50; }
  private calculateMAPE(values: number[]): number { return 10; }
  private calculateRMSE(values: number[]): number { return 75; }
  private generateAnomalyId(): string { return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
  private generateOpportunityId(): string { return `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
  private generateRecommendationId(): string { return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
  private generateAlertId(): string { return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }

  public async shutdown(): Promise<any> {
    if (this.analysisScheduler) {
      clearInterval(this.analysisScheduler);
    }
    
    if (this.costUpdateScheduler) {
      clearInterval(this.costUpdateScheduler);
    }
    
    this.emit('shutdown');
  }
}


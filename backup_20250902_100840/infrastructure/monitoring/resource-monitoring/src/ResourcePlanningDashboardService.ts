import { EventEmitter } from 'events';
import {
  ResourceUtilizationSnapshot,
  ResourceType,
  ResourceMetricType,
  ResourceRecommendation,
  ResourceAllocation,
  ResourceAlert
} from './ResourceDataModel';
import { CostCorrelation, CostOptimizationOpportunity } from './ResourceCostAnalysisService';
import { EfficiencyInsight, OptimizationOpportunity } from './ResourceEfficiencyAnalyticsService';

export interface DashboardConfig {
  refreshInterval: number;
  enableRealTimeUpdates: boolean;
  enableInteractiveFeatures: boolean;
  maxDataPoints: number;
  defaultTimeRange: 'last_hour' | 'last_day' | 'last_week' | 'last_month';
  widgetConfiguration: WidgetConfig[];
  customMetrics: CustomMetricConfig[];
  alertIntegration: boolean;
  exportFormats: string[];
  roleBasedAccess: boolean;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; width: number; height: number };
  configuration: Record<string, any>;
  data_source: string;
  refresh_rate: number;
  visibility: {
    roles: string[];
    conditions?: Array<{
      parameter: string;
      operator: string;
      value: any;
    }>;
  };
  interactions: {
    drill_down: boolean;
    filters: string[];
    actions: string[];
  };
}

export interface CustomMetricConfig {
  id: string;
  name: string;
  description: string;
  formula: string;
  unit: string;
  data_sources: string[];
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'custom';
  update_frequency: number;
  display_format: string;
}

export enum WidgetType {
  UTILIZATION_GAUGE = 'utilization_gauge',
  COST_TREND = 'cost_trend',
  EFFICIENCY_SCORE = 'efficiency_score',
  RESOURCE_ALLOCATION = 'resource_allocation',
  OPTIMIZATION_OPPORTUNITIES = 'optimization_opportunities',
  ALERT_SUMMARY = 'alert_summary',
  CAPACITY_FORECAST = 'capacity_forecast',
  PERFORMANCE_METRICS = 'performance_metrics',
  COST_BREAKDOWN = 'cost_breakdown',
  WASTE_ANALYSIS = 'waste_analysis',
  SLA_COMPLIANCE = 'sla_compliance',
  RESOURCE_TOPOLOGY = 'resource_topology',
  RECOMMENDATION_LIST = 'recommendation_list',
  CUSTOM_CHART = 'custom_chart',
  DATA_TABLE = 'data_table',
  KPI_CARD = 'kpi_card'
}

export interface DashboardData {
  timestamp: Date;
  time_range: { start: Date; end: Date };
  widgets: Map<string, WidgetData>;
  summary: DashboardSummary;
  alerts: DashboardAlert[];
  recommendations: DashboardRecommendation[];
  metadata: {
    data_freshness: Date;
    last_update: Date;
    data_quality: number;
    missing_data: string[];
    errors: string[];
  };
}

export interface WidgetData {
  widget_id: string;
  type: WidgetType;
  data: any;
  status: 'loading' | 'ready' | 'error' | 'no_data';
  error_message?: string;
  last_updated: Date;
  data_source: string;
  metrics: {
    data_points: number;
    data_quality: number;
    freshness_score: number;
  };
}

export interface DashboardSummary {
  total_resources: number;
  active_resources: number;
  total_cost: number;
  cost_trend: 'increasing' | 'decreasing' | 'stable';
  average_utilization: number;
  efficiency_score: number;
  critical_alerts: number;
  optimization_opportunities: number;
  potential_savings: number;
  compliance_score: number;
}

export interface DashboardAlert {
  id: string;
  resource_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  title: string;
  description: string;
  triggered_at: Date;
  acknowledged: boolean;
  actions_available: string[];
}

export interface DashboardRecommendation {
  id: string;
  resource_id: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potential_savings: number;
  effort_required: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface DashboardFilter {
  resource_type?: ResourceType[];
  resource_ids?: string[];
  time_range?: { start: Date; end: Date };
  cost_range?: { min: number; max: number };
  utilization_range?: { min: number; max: number };
  tags?: Record<string, string[]>;
  alert_severity?: string[];
  recommendation_priority?: string[];
}

export interface DashboardExport {
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'png';
  content: 'dashboard' | 'widget' | 'data' | 'summary';
  filters?: DashboardFilter;
  options: {
    include_charts: boolean;
    include_data: boolean;
    include_recommendations: boolean;
    time_period: string;
    layout: 'portrait' | 'landscape';
  };
}

export class ResourcePlanningDashboardService extends EventEmitter {
  private dashboardData: Map<string, DashboardData> = new Map();
  private widgetConfigs: Map<string, WidgetConfig> = new Map();
  private customMetrics: Map<string, CustomMetricConfig> = new Map();
  private refreshScheduler?: NodeJS.Timeout;
  private dataCache: Map<string, any> = new Map();

  constructor(private config: DashboardConfig) {
    super();
    this.initializeWidgets();
    this.initializeCustomMetrics();
    this.startRefreshScheduler();
  }

  async generateDashboard(
    dashboardId: string,
    resourceData: Map<string, ResourceUtilizationSnapshot>,
    costData: Map<string, CostCorrelation>,
    efficiencyData: Map<string, EfficiencyInsight[]>,
    allocationData: Map<string, ResourceAllocation[]>,
    alerts: Map<string, ResourceAlert[]>,
    recommendations: Map<string, ResourceRecommendation[]>,
    filters?: DashboardFilter
  ): Promise<DashboardData> {
    const timeRange = this.getTimeRange(filters);
    const timestamp = new Date();

    // Generate widget data
    const widgets = new Map<string, WidgetData>();
    
    for (const [widgetId, config] of this.widgetConfigs) {
      try {
        const widgetData = await this.generateWidgetData(
          config,
          resourceData,
          costData,
          efficiencyData,
          allocationData,
          alerts,
          recommendations,
          filters
        );
        widgets.set(widgetId, widgetData);
      } catch (error: any) {
        widgets.set(widgetId, {
          widget_id: widgetId,
          type: config.type,
          data: null,
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          last_updated: timestamp,
          data_source: config.data_source,
          metrics: { data_points: 0, data_quality: 0, freshness_score: 0 }
        });
      }
    }

    // Generate dashboard summary
    const summary = this.generateDashboardSummary(
      resourceData,
      costData,
      efficiencyData,
      alerts,
      recommendations
    );

    // Process alerts for dashboard
    const dashboardAlerts = this.processDashboardAlerts(alerts, filters);

    // Process recommendations for dashboard
    const dashboardRecommendations = this.processDashboardRecommendations(
      recommendations,
      costData,
      filters
    );

    const dashboardData: DashboardData = {
      timestamp,
      time_range: timeRange,
      widgets,
      summary,
      alerts: dashboardAlerts,
      recommendations: dashboardRecommendations,
      metadata: {
        data_freshness: this.calculateDataFreshness(resourceData),
        last_update: timestamp,
        data_quality: this.calculateDataQuality(widgets),
        missing_data: this.identifyMissingData(resourceData, costData),
        errors: this.collectErrors(widgets)
      }
    };

    // Cache dashboard data
    this.dashboardData.set(dashboardId, dashboardData);

    this.emit('dashboardGenerated', {
      dashboardId,
      widgets: widgets.size,
      alerts: dashboardAlerts.length,
      recommendations: dashboardRecommendations.length,
      timestamp
    });

    return dashboardData;
  }

  private async generateWidgetData(
    config: WidgetConfig,
    resourceData: Map<string, ResourceUtilizationSnapshot>,
    costData: Map<string, CostCorrelation>,
    efficiencyData: Map<string, EfficiencyInsight[]>,
    allocationData: Map<string, ResourceAllocation[]>,
    alerts: Map<string, ResourceAlert[]>,
    recommendations: Map<string, ResourceRecommendation[]>,
    filters?: DashboardFilter
  ): Promise<WidgetData> {
    const timestamp = new Date();
    let data: any = null;

    switch (config.type) {
      case WidgetType.UTILIZATION_GAUGE:
        data = this.generateUtilizationGaugeData(resourceData, filters);
        break;
      
      case WidgetType.COST_TREND:
        data = this.generateCostTrendData(costData, filters);
        break;
      
      case WidgetType.EFFICIENCY_SCORE:
        data = this.generateEfficiencyScoreData(resourceData, efficiencyData, filters);
        break;
      
      case WidgetType.RESOURCE_ALLOCATION:
        data = this.generateResourceAllocationData(allocationData, filters);
        break;
      
      case WidgetType.OPTIMIZATION_OPPORTUNITIES:
        data = this.generateOptimizationOpportunitiesData(recommendations, costData, filters);
        break;
      
      case WidgetType.ALERT_SUMMARY:
        data = this.generateAlertSummaryData(alerts, filters);
        break;
      
      case WidgetType.CAPACITY_FORECAST:
        data = this.generateCapacityForecastData(resourceData, filters);
        break;
      
      case WidgetType.PERFORMANCE_METRICS:
        data = this.generatePerformanceMetricsData(resourceData, filters);
        break;
      
      case WidgetType.COST_BREAKDOWN:
        data = this.generateCostBreakdownData(costData, filters);
        break;
      
      case WidgetType.WASTE_ANALYSIS:
        data = this.generateWasteAnalysisData(resourceData, efficiencyData, filters);
        break;
      
      case WidgetType.RECOMMENDATION_LIST:
        data = this.generateRecommendationListData(recommendations, filters);
        break;
      
      case WidgetType.KPI_CARD:
        data = this.generateKPICardData(config, resourceData, costData, efficiencyData, filters);
        break;
      
      default:
        throw new Error(`Unsupported widget type: ${config.type}`);
    }

    return {
      widget_id: config.id,
      type: config.type,
      data,
      status: 'ready',
      last_updated: timestamp,
      data_source: config.data_source,
      metrics: {
        data_points: this.countDataPoints(data),
        data_quality: this.assessDataQuality(data),
        freshness_score: this.calculateFreshnessScore(data, timestamp)
      }
    };
  }

  private generateUtilizationGaugeData(
    resourceData: Map<string, ResourceUtilizationSnapshot>,
    filters?: DashboardFilter
  ): any {
    const filteredResources = this.filterResources(Array.from(resourceData.values()), filters);
    
    if (filteredResources.length === 0) {
      return { value: 0, status: 'no_data' };
    }

    const totalUtilization = filteredResources.reduce((sum, resource) => 
      sum + resource.utilization.overall, 0
    );
    const averageUtilization = totalUtilization / filteredResources.length;

    return {
      value: Math.round(averageUtilization * 100),
      max: 100,
      min: 0,
      threshold_ranges: [
        { min: 0, max: 30, color: '#ff4444', label: 'Under-utilized' },
        { min: 30, max: 70, color: '#ffaa00', label: 'Optimal' },
        { min: 70, max: 85, color: '#44ff44', label: 'Good' },
        { min: 85, max: 100, color: '#ff4444', label: 'Over-utilized' }
      ],
      breakdown: {
        cpu: Math.round(filteredResources.reduce((sum, r) => sum + r.utilization.cpu, 0) / filteredResources.length * 100),
        memory: Math.round(filteredResources.reduce((sum, r) => sum + r.utilization.memory, 0) / filteredResources.length * 100),
        storage: Math.round(filteredResources.reduce((sum, r) => sum + r.utilization.storage, 0) / filteredResources.length * 100),
        network: Math.round(filteredResources.reduce((sum, r) => sum + r.utilization.network, 0) / filteredResources.length * 100)
      },
      trend: this.calculateUtilizationTrend(filteredResources),
      last_updated: new Date()
    };
  }

  private generateCostTrendData(
    costData: Map<string, CostCorrelation>,
    filters?: DashboardFilter
  ): any {
    const filteredCostData = this.filterCostData(Array.from(costData.values()), filters);
    
    if (filteredCostData.length === 0) {
      return { data_points: [], trend: 'stable', total_cost: 0 };
    }

    // Generate time series data for cost trend
    const timePoints = this.generateTimePoints(filters);
    const trendData = timePoints.map(timestamp => {
      const totalCost = filteredCostData.reduce((sum, correlation) => {
        // Find cost data point closest to timestamp
        const forecast = correlation.forecast.predictions.find(p => 
          Math.abs(p.date.getTime() - timestamp.getTime()) < 86400000 // Within 24 hours
        );
        return sum + (forecast?.predicted_cost || 0);
      }, 0);

      return {
        timestamp,
        cost: totalCost,
        forecast: this.isForecastPoint(timestamp)
      };
    });

    return {
      data_points: trendData,
      trend: this.calculateCostTrend(trendData),
      total_cost: trendData[trendData.length - 1]?.cost || 0,
      cost_breakdown: this.generateCostBreakdown(filteredCostData),
      savings_opportunities: this.calculateTotalSavingsOpportunities(filteredCostData),
      forecast_accuracy: this.calculateForecastAccuracy(filteredCostData)
    };
  }

  private generateEfficiencyScoreData(
    resourceData: Map<string, ResourceUtilizationSnapshot>,
    efficiencyData: Map<string, EfficiencyInsight[]>,
    filters?: DashboardFilter
  ): any {
    const filteredResources = this.filterResources(Array.from(resourceData.values()), filters);
    
    if (filteredResources.length === 0) {
      return { score: 0, status: 'no_data' };
    }

    const efficiencyScores = filteredResources.map(resource => 
      resource.efficiency?.score || 0
    );
    
    const averageScore = efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length;

    // Get insights for filtered resources
    const allInsights = Array.from(efficiencyData.values()).flat()
      .filter(insight => {
        if (!filters?.resource_ids) return true;
        return filters.resource_ids.includes(insight.resourceId);
      });

    return {
      score: Math.round(averageScore * 100),
      grade: this.getEfficiencyGrade(averageScore),
      breakdown: {
        utilization: Math.round(filteredResources.reduce((sum, r) => sum + (r.efficiency?.breakdown?.utilization || 0), 0) / filteredResources.length * 100),
        performance: Math.round(filteredResources.reduce((sum, r) => sum + (r.efficiency?.breakdown?.performance || 0), 0) / filteredResources.length * 100),
        cost: Math.round(filteredResources.reduce((sum, r) => sum + (r.efficiency?.breakdown?.cost || 0), 0) / filteredResources.length * 100),
        reliability: Math.round(filteredResources.reduce((sum, r) => sum + (r.efficiency?.breakdown?.reliability || 0), 0) / filteredResources.length * 100)
      },
      insights: allInsights.slice(0, 5), // Top 5 insights
      improvement_potential: this.calculateImprovementPotential(allInsights),
      benchmark_comparison: this.getBenchmarkComparison(averageScore)
    };
  }

  private generateResourceAllocationData(
    allocationData: Map<string, ResourceAllocation[]>,
    filters?: DashboardFilter
  ): any {
    const allAllocations = Array.from(allocationData.values()).flat();
    const filteredAllocations = this.filterAllocations(allAllocations, filters);

    if (filteredAllocations.length === 0) {
      return { allocations: [], summary: { total: 0, active: 0, efficiency: 0 } };
    }

    const activeAllocations = filteredAllocations.filter(a => a.status === 'active');
    const totalEfficiency = activeAllocations.reduce((sum, a) => {
      const cpuEff = a.allocation.cpu?.efficiency || 0;
      const memEff = a.allocation.memory?.efficiency || 0;
      const storageEff = a.allocation.storage?.efficiency || 0;
      return sum + ((cpuEff + memEff + storageEff) / 3);
    }, 0);

    return {
      allocations: filteredAllocations.slice(0, 20), // Limit to 20 for display
      summary: {
        total: filteredAllocations.length,
        active: activeAllocations.length,
        efficiency: activeAllocations.length > 0 ? totalEfficiency / activeAllocations.length : 0
      },
      utilization_breakdown: this.calculateAllocationUtilization(activeAllocations),
      cost_summary: this.calculateAllocationCosts(activeAllocations),
      waste_analysis: this.calculateAllocationWaste(activeAllocations)
    };
  }

  private generateOptimizationOpportunitiesData(
    recommendations: Map<string, ResourceRecommendation[]>,
    costData: Map<string, CostCorrelation>,
    filters?: DashboardFilter
  ): any {
    const allRecommendations = Array.from(recommendations.values()).flat();
    const filteredRecommendations = this.filterRecommendations(allRecommendations, filters);

    // Get cost optimization opportunities from cost data
    const costOpportunities = Array.from(costData.values())
      .map(correlation => correlation.optimization_opportunities)
      .flat();

    const topOpportunities = [
      ...filteredRecommendations.slice(0, 10),
      // Convert cost opportunities to recommendations format for display
      ...costOpportunities.slice(0, 5).map(opp => ({
        id: opp.id,
        type: 'cost_optimization' as const,
        priority: opp.priority > 80 ? 'high' as const : 'medium' as const,
        title: opp.title,
        description: opp.description,
        rationale: `Potential savings: $${opp.savings_amount}`,
        implementation: {
          steps: opp.implementation.steps,
          effort: opp.implementation.effort,
          risk: opp.implementation.risk,
          timeline: opp.implementation.timeline,
          prerequisites: opp.implementation.dependencies
        },
        impact: {
          cost_savings: opp.savings_amount,
          performance_improvement: opp.impact_analysis.performance_impact,
          efficiency_gain: opp.savings_percentage / 100,
          risk_reduction: 0.1
        },
        metrics_affected: [],
        confidence: opp.confidence
      }))
    ].sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      if (aPriority !== bPriority) return bPriority - aPriority;
      return (b.impact.cost_savings || 0) - (a.impact.cost_savings || 0);
    });

    const totalSavings = topOpportunities.reduce((sum, opp) => 
      sum + (opp.impact.cost_savings || 0), 0
    );

    return {
      opportunities: topOpportunities.slice(0, 15),
      summary: {
        total_opportunities: topOpportunities.length,
        potential_savings: totalSavings,
        high_priority: topOpportunities.filter(o => o.priority === 'high' || o.priority === 'critical').length,
        quick_wins: topOpportunities.filter(o => o.implementation.effort === 'low' && (o.impact.cost_savings || 0) > 100).length
      },
      categories: this.categorizeOpportunities(topOpportunities),
      roi_analysis: this.calculateROIAnalysis(topOpportunities)
    };
  }

  private generateAlertSummaryData(
    alerts: Map<string, ResourceAlert[]>,
    filters?: DashboardFilter
  ): any {
    const allAlerts = Array.from(alerts.values()).flat();
    const filteredAlerts = this.filterAlerts(allAlerts, filters);

    const criticalAlerts = filteredAlerts.filter(a => a.severity === 'emergency' || a.severity === 'critical');
    const warningAlerts = filteredAlerts.filter(a => a.severity === 'warning');
    const infoAlerts = filteredAlerts.filter(a => a.severity === 'info');

    return {
      total_alerts: filteredAlerts.length,
      critical: criticalAlerts.length,
      warning: warningAlerts.length,
      info: infoAlerts.length,
      recent_alerts: filteredAlerts.slice(0, 10),
      alert_trends: this.calculateAlertTrends(filteredAlerts),
      top_alert_types: this.getTopAlertTypes(filteredAlerts),
      resolution_metrics: this.calculateResolutionMetrics(filteredAlerts)
    };
  }

  private generateDashboardSummary(
    resourceData: Map<string, ResourceUtilizationSnapshot>,
    costData: Map<string, CostCorrelation>,
    efficiencyData: Map<string, EfficiencyInsight[]>,
    alerts: Map<string, ResourceAlert[]>,
    recommendations: Map<string, ResourceRecommendation[]>
  ): DashboardSummary {
    const resources = Array.from(resourceData.values());
    const allAlerts = Array.from(alerts.values()).flat();
    const allRecommendations = Array.from(recommendations.values()).flat();
    const allCostData = Array.from(costData.values());

    const totalCost = allCostData.reduce((sum, correlation) => {
      const latestPrediction = correlation.forecast.predictions[correlation.forecast.predictions.length - 1];
      return sum + (latestPrediction?.predicted_cost || 0);
    }, 0);

    const averageUtilization = resources.length > 0 
      ? resources.reduce((sum, r) => sum + r.utilization.overall, 0) / resources.length 
      : 0;

    const averageEfficiency = resources.length > 0 
      ? resources.reduce((sum, r) => sum + (r.efficiency?.score || 0), 0) / resources.length 
      : 0;

    const potentialSavings = allCostData.reduce((sum, correlation) => 
      sum + correlation.optimization_opportunities.reduce((opSum, opp) => opSum + opp.savings_amount, 0), 0
    ) + allRecommendations.reduce((sum, rec) => sum + (rec.impact.cost_savings || 0), 0);

    return {
      total_resources: resources.length,
      active_resources: resources.filter(r => r.utilization.overall > 0.01).length,
      total_cost: totalCost,
      cost_trend: this.determineCostTrend(allCostData),
      average_utilization: averageUtilization,
      efficiency_score: averageEfficiency,
      critical_alerts: allAlerts.filter(a => a.severity === 'critical' || a.severity === 'emergency').length,
      optimization_opportunities: allRecommendations.length + allCostData.reduce((sum, c) => sum + c.optimization_opportunities.length, 0),
      potential_savings: potentialSavings,
      compliance_score: 0.95 // Placeholder
    };
  }

  async exportDashboard(
    dashboardId: string,
    exportConfig: DashboardExport
  ): Promise<Buffer | string> {
    const dashboardData = this.dashboardData.get(dashboardId);
    if (!dashboardData) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    switch (exportConfig.format) {
      case 'json':
        return this.exportToJSON(dashboardData, exportConfig);
      case 'csv':
        return this.exportToCSV(dashboardData, exportConfig);
      case 'excel':
        return this.exportToExcel(dashboardData, exportConfig);
      case 'pdf':
        return this.exportToPDF(dashboardData, exportConfig);
      case 'png':
        return this.exportToPNG(dashboardData, exportConfig);
      default:
        throw new Error(`Unsupported export format: ${exportConfig.format}`);
    }
  }

  // Helper methods and implementations
  private initializeWidgets(): void {
    // Default widget configurations
    const defaultWidgets: WidgetConfig[] = [
      {
        id: 'main_utilization',
        type: WidgetType.UTILIZATION_GAUGE,
        title: 'Overall Resource Utilization',
        position: { x: 0, y: 0, width: 4, height: 3 },
        configuration: { show_breakdown: true },
        data_source: 'resource_utilization',
        refresh_rate: 60000,
        visibility: { roles: ['admin', 'operator', 'viewer'] },
        interactions: { drill_down: true, filters: ['resource-type'], actions: ['optimize'] }
      },
      {
        id: 'cost_trend',
        type: WidgetType.COST_TREND,
        title: 'Cost Trend Analysis',
        position: { x: 4, y: 0, width: 8, height: 3 },
        configuration: { time_range: '30d', show_forecast: true },
        data_source: 'cost_analysis',
        refresh_rate: 300000,
        visibility: { roles: ['admin', 'financial'] },
        interactions: { drill_down: true, filters: ['time-range'], actions: ['export'] }
      },
      {
        id: 'efficiency_score',
        type: WidgetType.EFFICIENCY_SCORE,
        title: 'Efficiency Score',
        position: { x: 0, y: 3, width: 4, height: 3 },
        configuration: { show_benchmark: true },
        data_source: 'efficiency_analytics',
        refresh_rate: 120000,
        visibility: { roles: ['admin', 'operator'] },
        interactions: { drill_down: true, filters: [], actions: ['improve'] }
      },
      {
        id: 'optimization_opportunities',
        type: WidgetType.OPTIMIZATION_OPPORTUNITIES,
        title: 'Top Optimization Opportunities',
        position: { x: 4, y: 3, width: 8, height: 4 },
        configuration: { max_items: 10, sort_by: 'savings' },
        data_source: 'recommendations',
        refresh_rate: 600000,
        visibility: { roles: ['admin', 'operator'] },
        interactions: { drill_down: true, filters: ['priority'], actions: ['apply', 'dismiss'] }
      }
    ];

    for (const widget of defaultWidgets) {
      this.widgetConfigs.set(widget.id, widget);
    }
  }

  private initializeCustomMetrics(): void {
    // Default custom metrics
    const defaultMetrics: CustomMetricConfig[] = [
      {
        id: 'cost_per_utilization',
        name: 'Cost per Utilization Point',
        description: 'Cost divided by utilization percentage',
        formula: 'cost / (utilization * 100)',
        unit: '$/utilization%',
        data_sources: ['cost_analysis', 'resource_utilization'],
        aggregation: 'avg',
        update_frequency: 300000,
        display_format: '${value:.2f}'
      },
      {
        id: 'efficiency_weighted_cost',
        name: 'Efficiency-Weighted Cost',
        description: 'Cost adjusted for efficiency score',
        formula: 'cost / efficiency_score',
        unit: '$/efficiency',
        data_sources: ['cost_analysis', 'efficiency_analytics'],
        aggregation: 'avg',
        update_frequency: 300000,
        display_format: '${value:.2f}'
      }
    ];

    for (const metric of defaultMetrics) {
      this.customMetrics.set(metric.id, metric);
    }
  }

  private startRefreshScheduler(): void {
    if (this.config.enableRealTimeUpdates) {
      this.refreshScheduler = setInterval(async () => {
        try {
          await this.refreshDashboards();
        } catch (error: any) {
          console.error('Dashboard refresh failed:', error instanceof Error ? error.message : 'Unknown error');
        }
      }, this.config.refreshInterval);
    }
  }

  private async refreshDashboards(): Promise<any> {
    for (const dashboardId of this.dashboardData.keys()) {
      this.emit('dashboardRefreshRequested', { dashboardId, timestamp: new Date() });
    }
  }

  // Helper method implementations (simplified for brevity)
  private getTimeRange(filters?: DashboardFilter): { start: Date; end: Date } {
    if (filters?.time_range) {
      return filters.time_range;
    }
    
    const end = new Date();
    const start = new Date();
    
    switch (this.config.defaultTimeRange) {
      case 'last_hour':
        start.setHours(start.getHours() - 1);
        break;
      case 'last_day':
        start.setDate(start.getDate() - 1);
        break;
      case 'last_week':
        start.setDate(start.getDate() - 7);
        break;
      case 'last_month':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    
    return { start, end };
  }

  private filterResources(resources: ResourceUtilizationSnapshot[], filters?: DashboardFilter): ResourceUtilizationSnapshot[] {
    if (!filters) return resources;
    
    return resources.filter(resource => {
      if (filters.resource_type && !filters.resource_type.includes(resource.resourceType)) {
        return false;
      }
      if (filters.resource_ids && !filters.resource_ids.includes(resource.resourceId)) {
        return false;
      }
      if (filters.utilization_range) {
        const util = resource.utilization.overall;
        if (util < filters.utilization_range.min || util > filters.utilization_range.max) {
          return false;
        }
      }
      return true;
    });
  }

  // Getter methods
  public getDashboard(dashboardId: string): DashboardData | undefined {
    return this.dashboardData.get(dashboardId);
  }

  public getWidgetConfigs(): WidgetConfig[] {
    return Array.from(this.widgetConfigs.values());
  }

  public getCustomMetrics(): CustomMetricConfig[] {
    return Array.from(this.customMetrics.values());
  }

  // Additional helper methods (simplified implementations)
  private filterCostData(costData: CostCorrelation[], filters?: DashboardFilter): CostCorrelation[] { return costData; }
  private filterAllocations(allocations: ResourceAllocation[], filters?: DashboardFilter): ResourceAllocation[] { return allocations; }
  private filterRecommendations(recommendations: ResourceRecommendation[], filters?: DashboardFilter): ResourceRecommendation[] { return recommendations; }
  private filterAlerts(alerts: ResourceAlert[], filters?: DashboardFilter): ResourceAlert[] { return alerts; }
  private generateTimePoints(filters?: DashboardFilter): Date[] { return [new Date()]; }
  private isForecastPoint(timestamp: Date): boolean { return false; }
  private calculateUtilizationTrend(resources: ResourceUtilizationSnapshot[]): string { return 'stable'; }
  private calculateCostTrend(trendData: any[]): string { return 'stable'; }
  private generateCostBreakdown(costData: CostCorrelation[]): any { return {}; }
  private calculateTotalSavingsOpportunities(costData: CostCorrelation[]): number { return 0; }
  private calculateForecastAccuracy(costData: CostCorrelation[]): number { return 0.85; }
  private getEfficiencyGrade(score: number): string { return score > 0.8 ? 'A' : score > 0.6 ? 'B' : 'C'; }
  private calculateImprovementPotential(insights: EfficiencyInsight[]): number { return 25; }
  private getBenchmarkComparison(score: number): any { return { industry_average: 0.75, percentile: 60 }; }
  private calculateAllocationUtilization(allocations: ResourceAllocation[]): any { return {}; }
  private calculateAllocationCosts(allocations: ResourceAllocation[]): any { return {}; }
  private calculateAllocationWaste(allocations: ResourceAllocation[]): any { return {}; }
  private categorizeOpportunities(opportunities: any[]): any { return {}; }
  private calculateROIAnalysis(opportunities: any[]): any { return {}; }
  private calculateAlertTrends(alerts: ResourceAlert[]): any { return {}; }
  private getTopAlertTypes(alerts: ResourceAlert[]): any { return {}; }
  private calculateResolutionMetrics(alerts: ResourceAlert[]): any { return {}; }
  private determineCostTrend(costData: CostCorrelation[]): 'increasing' | 'decreasing' | 'stable' { return 'stable'; }
  private calculateDataFreshness(resourceData: Map<string, ResourceUtilizationSnapshot>): Date { return new Date(); }
  private calculateDataQuality(widgets: Map<string, WidgetData>): number { return 0.95; }
  private identifyMissingData(resourceData: Map<string, ResourceUtilizationSnapshot>, costData: Map<string, CostCorrelation>): string[] { return []; }
  private collectErrors(widgets: Map<string, WidgetData>): string[] { return []; }
  private countDataPoints(data: any): number { return 100; }
  private assessDataQuality(data: any): number { return 0.95; }
  private calculateFreshnessScore(data: any, timestamp: Date): number { return 1.0; }
  private processDashboardAlerts(alerts: Map<string, ResourceAlert[]>, filters?: DashboardFilter): DashboardAlert[] { return []; }
  private processDashboardRecommendations(recommendations: Map<string, ResourceRecommendation[]>, costData: Map<string, CostCorrelation>, filters?: DashboardFilter): DashboardRecommendation[] { return []; }
  private generateKPICardData(config: WidgetConfig, resourceData: Map<string, ResourceUtilizationSnapshot>, costData: Map<string, CostCorrelation>, efficiencyData: Map<string, EfficiencyInsight[]>, filters?: DashboardFilter): any { return {}; }
  private generateCapacityForecastData(resourceData: Map<string, ResourceUtilizationSnapshot>, filters?: DashboardFilter): any { return {}; }
  private generatePerformanceMetricsData(resourceData: Map<string, ResourceUtilizationSnapshot>, filters?: DashboardFilter): any { return {}; }
  private generateWasteAnalysisData(resourceData: Map<string, ResourceUtilizationSnapshot>, efficiencyData: Map<string, EfficiencyInsight[]>, filters?: DashboardFilter): any { return {}; }
  private generateRecommendationListData(recommendations: Map<string, ResourceRecommendation[]>, filters?: DashboardFilter): any { return {}; }
  private exportToJSON(dashboardData: DashboardData, config: DashboardExport): string { return JSON.stringify(dashboardData, null, 2); }
  private exportToCSV(dashboardData: DashboardData, config: DashboardExport): string { return 'csv data'; }
  private exportToExcel(dashboardData: DashboardData, config: DashboardExport): Buffer { return Buffer.from('excel data'); }
  private exportToPDF(dashboardData: DashboardData, config: DashboardExport): Buffer { return Buffer.from('pdf data'); }
  private exportToPNG(dashboardData: DashboardData, config: DashboardExport): Buffer { return Buffer.from('png data'); }

  public async shutdown(): Promise<any> {
    if (this.refreshScheduler) {
      clearInterval(this.refreshScheduler);
    }
    
    this.emit('shutdown');
  }
}


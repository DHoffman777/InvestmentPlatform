import { EventEmitter } from 'events';
import {
  DashboardTemplate,
  BusinessKPI,
  MetricDefinition,
  MetricValue,
  FINANCIAL_KPIS,
  OPERATIONAL_KPIS,
  CLIENT_KPIS,
  PORTFOLIO_KPIS,
  RISK_KPIS,
  COMPLIANCE_KPIS
} from './BusinessMetricsDataModel';

export interface ExecutiveDashboardConfig {
  refreshInterval: number;
  dataRetentionDays: number;
  autoExportEnabled: boolean;
  cacheEnabled: boolean;
  performanceThresholds: PerformanceThresholds;
}

export interface PerformanceThresholds {
  loadTime: number;
  dataFreshness: number;
  errorRate: number;
  availabilityTarget: number;
}

export interface ExecutiveMetric {
  id: string;
  name: string;
  displayName: string;
  category: 'financial' | 'operational' | 'strategic' | 'risk';
  currentValue: number;
  previousValue: number;
  target?: number;
  benchmark?: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  unit: string;
  description: string;
  lastUpdated: Date;
  dataQuality: number;
}

export interface ExecutiveSummary {
  id: string;
  tenantId: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  keyMetrics: ExecutiveMetric[];
  insights: ExecutiveInsight[];
  alerts: ExecutiveAlert[];
  recommendations: ExecutiveRecommendation[];
  performance: PerformanceSummary;
  attachments: ReportAttachment[];
}

export interface ExecutiveInsight {
  id: string;
  type: 'trend_analysis' | 'anomaly_detection' | 'correlation' | 'forecasting' | 'benchmark_comparison';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  metrics: string[];
  dataPoints: InsightDataPoint[];
  visualizationType: 'chart' | 'table' | 'text' | 'scorecard';
  createdAt: Date;
}

export interface InsightDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ExecutiveAlert {
  id: string;
  type: 'performance' | 'risk' | 'compliance' | 'operational';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedMetrics: string[];
  triggeredAt: Date;
  expectedResolution?: Date;
  actionRequired: boolean;
  context: Record<string, any>;
}

export interface ExecutiveRecommendation {
  id: string;
  type: 'optimization' | 'risk_mitigation' | 'growth_opportunity' | 'cost_reduction';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: {
    metric: string;
    estimatedImprovement: number;
    timeframe: string;
  };
  actionItems: ActionItem[];
  resources: ResourceRequirement[];
  feasibilityScore: number;
}

export interface ActionItem {
  id: string;
  description: string;
  owner?: string;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  dependencies: string[];
}

export interface ResourceRequirement {
  type: 'human' | 'financial' | 'technical' | 'time';
  description: string;
  estimatedCost?: number;
  duration?: number;
}

export interface PerformanceSummary {
  overall: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    trend: 'improving' | 'stable' | 'declining';
  };
  categories: {
    financial: CategoryPerformance;
    operational: CategoryPerformance;
    client: CategoryPerformance;
    risk: CategoryPerformance;
  };
  benchmarks: BenchmarkComparison[];
}

export interface CategoryPerformance {
  score: number;
  metrics: {
    total: number;
    onTarget: number;
    atRisk: number;
    offTrack: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  keyDrivers: string[];
}

export interface BenchmarkComparison {
  category: string;
  ourPerformance: number;
  industryAverage: number;
  topQuartile: number;
  percentile: number;
  gap: number;
}

export interface ReportAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'excel' | 'csv' | 'image';
  size: number;
  url: string;
  description?: string;
  generatedAt: Date;
}

export interface DrillDownContext {
  metricId: string;
  dimension: string;
  value: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  filters: Record<string, any>;
}

export interface DrillDownResult {
  context: DrillDownContext;
  data: DrillDownData[];
  aggregations: DrillDownAggregation[];
  insights: string[];
  nextLevelDimensions: string[];
}

export interface DrillDownData {
  dimension: string;
  value: string;
  metric: number;
  contribution: number;
  trend: number;
  rank: number;
}

export interface DrillDownAggregation {
  type: 'sum' | 'avg' | 'min' | 'max' | 'count';
  value: number;
  label: string;
}

export class ExecutiveReportingDashboard extends EventEmitter {
  private config: ExecutiveDashboardConfig;
  private executiveMetrics: Map<string, ExecutiveMetric> = new Map();
  private summaryCache: Map<string, ExecutiveSummary> = new Map();
  private benchmarkData: Map<string, BenchmarkComparison[]> = new Map();
  private insights: Map<string, ExecutiveInsight[]> = new Map();
  private recommendations: Map<string, ExecutiveRecommendation[]> = new Map();
  private reportingTimer: NodeJS.Timeout;
  private cacheCleanupTimer: NodeJS.Timeout;

  constructor(config: ExecutiveDashboardConfig) {
    super();
    this.config = config;
    this.initializeExecutiveMetrics();
    this.startReportingTimer();
    this.startCacheCleanup();
  }

  async generateExecutiveSummary(
    tenantId: string, 
    period: { start: Date; end: Date; type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' }
  ): Promise<ExecutiveSummary> {
    const cacheKey = `${tenantId}_${period.type}_${period.start.toISOString()}_${period.end.toISOString()}`;
    
    if (this.config.cacheEnabled && this.summaryCache.has(cacheKey)) {
      const cached = this.summaryCache.get(cacheKey)!;
      const cacheAge = Date.now() - cached.generatedAt.getTime();
      if (cacheAge < this.config.refreshInterval) {
        return cached;
      }
    }

    const summary: ExecutiveSummary = {
      id: this.generateId(),
      tenantId,
      generatedAt: new Date(),
      period,
      keyMetrics: await this.getKeyMetrics(tenantId, period),
      insights: await this.generateInsights(tenantId, period),
      alerts: await this.getExecutiveAlerts(tenantId),
      recommendations: await this.generateRecommendations(tenantId, period),
      performance: await this.calculatePerformanceSummary(tenantId, period),
      attachments: []
    };

    if (this.config.cacheEnabled) {
      this.summaryCache.set(cacheKey, summary);
    }

    this.emit('executiveSummaryGenerated', { 
      tenantId, 
      summaryId: summary.id, 
      period: period.type 
    });

    return summary;
  }

  async getKeyMetrics(tenantId: string, period: { start: Date; end: Date }): Promise<ExecutiveMetric[]> {
    const metrics: ExecutiveMetric[] = [];

    const financialMetrics = await this.calculateFinancialMetrics(tenantId, period);
    const operationalMetrics = await this.calculateOperationalMetrics(tenantId, period);
    const clientMetrics = await this.calculateClientMetrics(tenantId, period);
    const riskMetrics = await this.calculateRiskMetrics(tenantId, period);

    metrics.push(...financialMetrics, ...operationalMetrics, ...clientMetrics, ...riskMetrics);

    return metrics.sort((a, b) => {
      const priorityOrder = ['critical', 'warning', 'good', 'excellent'];
      return priorityOrder.indexOf(a.status) - priorityOrder.indexOf(b.status);
    });
  }

  private async calculateFinancialMetrics(tenantId: string, period: { start: Date; end: Date }): Promise<ExecutiveMetric[]> {
    const metrics: ExecutiveMetric[] = [];

    const aum = await this.calculateAUM(tenantId, period);
    metrics.push({
      id: FINANCIAL_KPIS.ASSETS_UNDER_MANAGEMENT,
      name: 'assets_under_management',
      displayName: 'Assets Under Management',
      category: 'financial',
      currentValue: aum.current,
      previousValue: aum.previous,
      target: aum.target,
      trend: this.calculateTrend(aum.current, aum.previous),
      trendPercentage: this.calculateTrendPercentage(aum.current, aum.previous),
      status: this.calculateStatus(aum.current, aum.target),
      unit: 'USD',
      description: 'Total assets under management across all portfolios',
      lastUpdated: new Date(),
      dataQuality: 95
    });

    const revenue = await this.calculateRevenue(tenantId, period);
    metrics.push({
      id: FINANCIAL_KPIS.REVENUE,
      name: 'revenue',
      displayName: 'Revenue',
      category: 'financial',
      currentValue: revenue.current,
      previousValue: revenue.previous,
      target: revenue.target,
      trend: this.calculateTrend(revenue.current, revenue.previous),
      trendPercentage: this.calculateTrendPercentage(revenue.current, revenue.previous),
      status: this.calculateStatus(revenue.current, revenue.target),
      unit: 'USD',
      description: 'Total revenue generated in the period',
      lastUpdated: new Date(),
      dataQuality: 98
    });

    const netFlows = await this.calculateNetFlows(tenantId, period);
    metrics.push({
      id: FINANCIAL_KPIS.NET_ASSET_FLOWS,
      name: 'net_asset_flows',
      displayName: 'Net Asset Flows',
      category: 'financial',
      currentValue: netFlows.current,
      previousValue: netFlows.previous,
      target: netFlows.target,
      trend: this.calculateTrend(netFlows.current, netFlows.previous),
      trendPercentage: this.calculateTrendPercentage(netFlows.current, netFlows.previous),
      status: this.calculateStatus(netFlows.current, netFlows.target),
      unit: 'USD',
      description: 'Net inflows minus outflows of assets',
      lastUpdated: new Date(),
      dataQuality: 92
    });

    return metrics;
  }

  private async calculateOperationalMetrics(tenantId: string, period: { start: Date; end: Date }): Promise<ExecutiveMetric[]> {
    const metrics: ExecutiveMetric[] = [];

    const uptime = await this.calculateSystemUptime(tenantId, period);
    metrics.push({
      id: OPERATIONAL_KPIS.SYSTEM_UPTIME,
      name: 'system_uptime',
      displayName: 'System Uptime',
      category: 'operational',
      currentValue: uptime.current,
      previousValue: uptime.previous,
      target: 99.9,
      trend: this.calculateTrend(uptime.current, uptime.previous),
      trendPercentage: this.calculateTrendPercentage(uptime.current, uptime.previous),
      status: this.calculateStatus(uptime.current, 99.9),
      unit: '%',
      description: 'System availability percentage',
      lastUpdated: new Date(),
      dataQuality: 100
    });

    const tradeExecTime = await this.calculateTradeExecutionTime(tenantId, period);
    metrics.push({
      id: OPERATIONAL_KPIS.TRADE_EXECUTION_TIME,
      name: 'trade_execution_time',
      displayName: 'Average Trade Execution Time',
      category: 'operational',
      currentValue: tradeExecTime.current,
      previousValue: tradeExecTime.previous,
      target: 2000,
      trend: this.calculateTrend(tradeExecTime.previous, tradeExecTime.current),
      trendPercentage: this.calculateTrendPercentage(tradeExecTime.previous, tradeExecTime.current),
      status: this.calculateStatus(2000, tradeExecTime.current),
      unit: 'ms',
      description: 'Average time to execute trades',
      lastUpdated: new Date(),
      dataQuality: 97
    });

    return metrics;
  }

  private async calculateClientMetrics(tenantId: string, period: { start: Date; end: Date }): Promise<ExecutiveMetric[]> {
    const metrics: ExecutiveMetric[] = [];

    const clientCount = await this.calculateClientCount(tenantId, period);
    metrics.push({
      id: CLIENT_KPIS.CLIENT_COUNT,
      name: 'client_count',
      displayName: 'Total Clients',
      category: 'strategic',
      currentValue: clientCount.current,
      previousValue: clientCount.previous,
      trend: this.calculateTrend(clientCount.current, clientCount.previous),
      trendPercentage: this.calculateTrendPercentage(clientCount.current, clientCount.previous),
      status: this.calculateGrowthStatus(clientCount.current, clientCount.previous),
      unit: 'count',
      description: 'Total number of active clients',
      lastUpdated: new Date(),
      dataQuality: 100
    });

    const retentionRate = await this.calculateRetentionRate(tenantId, period);
    metrics.push({
      id: CLIENT_KPIS.CLIENT_RETENTION_RATE,
      name: 'client_retention_rate',
      displayName: 'Client Retention Rate',
      category: 'strategic',
      currentValue: retentionRate.current,
      previousValue: retentionRate.previous,
      target: 95,
      trend: this.calculateTrend(retentionRate.current, retentionRate.previous),
      trendPercentage: this.calculateTrendPercentage(retentionRate.current, retentionRate.previous),
      status: this.calculateStatus(retentionRate.current, 95),
      unit: '%',
      description: 'Percentage of clients retained over the period',
      lastUpdated: new Date(),
      dataQuality: 94
    });

    return metrics;
  }

  private async calculateRiskMetrics(tenantId: string, period: { start: Date; end: Date }): Promise<ExecutiveMetric[]> {
    const metrics: ExecutiveMetric[] = [];

    const portfolioVar = await this.calculatePortfolioVaR(tenantId, period);
    metrics.push({
      id: RISK_KPIS.PORTFOLIO_VAR,
      name: 'portfolio_var',
      displayName: 'Portfolio VaR (95%)',
      category: 'risk',
      currentValue: portfolioVar.current,
      previousValue: portfolioVar.previous,
      target: 0.02,
      trend: this.calculateTrend(portfolioVar.previous, portfolioVar.current),
      trendPercentage: this.calculateTrendPercentage(portfolioVar.previous, portfolioVar.current),
      status: this.calculateRiskStatus(portfolioVar.current, 0.02),
      unit: '%',
      description: 'Value at Risk at 95% confidence level',
      lastUpdated: new Date(),
      dataQuality: 91
    });

    return metrics;
  }

  async generateInsights(tenantId: string, period: { start: Date; end: Date }): Promise<ExecutiveInsight[]> {
    const insights: ExecutiveInsight[] = [];

    const trendInsight = await this.generateTrendAnalysis(tenantId, period);
    if (trendInsight) insights.push(trendInsight);

    const anomalyInsight = await this.generateAnomalyInsight(tenantId, period);
    if (anomalyInsight) insights.push(anomalyInsight);

    const correlationInsight = await this.generateCorrelationInsight(tenantId, period);
    if (correlationInsight) insights.push(correlationInsight);

    const benchmarkInsight = await this.generateBenchmarkInsight(tenantId, period);
    if (benchmarkInsight) insights.push(benchmarkInsight);

    return insights;
  }

  private async generateTrendAnalysis(tenantId: string, period: { start: Date; end: Date }): Promise<ExecutiveInsight | null> {
    const metrics = await this.getKeyMetrics(tenantId, period);
    const strongTrends = metrics.filter(m => Math.abs(m.trendPercentage) > 10);

    if (strongTrends.length === 0) return null;

    const topTrend = strongTrends.sort((a, b) => Math.abs(b.trendPercentage) - Math.abs(a.trendPercentage))[0];

    return {
      id: this.generateId(),
      type: 'trend_analysis',
      title: `Strong ${topTrend.trend} trend in ${topTrend.displayName}`,
      description: `${topTrend.displayName} has shown a ${Math.abs(topTrend.trendPercentage).toFixed(1)}% ${topTrend.trend === 'up' ? 'increase' : 'decrease'} compared to the previous period.`,
      impact: Math.abs(topTrend.trendPercentage) > 20 ? 'high' : 'medium',
      confidence: 0.85,
      metrics: [topTrend.id],
      dataPoints: [
        { timestamp: new Date(Date.now() - 86400000), value: topTrend.previousValue },
        { timestamp: new Date(), value: topTrend.currentValue }
      ],
      visualizationType: 'chart',
      createdAt: new Date()
    };
  }

  private async generateAnomalyInsight(tenantId: string, period: { start: Date; end: Date }): Promise<ExecutiveInsight | null> {
    const metrics = await this.getKeyMetrics(tenantId, period);
    const anomalies = metrics.filter(m => m.status === 'critical' || m.status === 'warning');

    if (anomalies.length === 0) return null;

    const criticalAnomaly = anomalies.find(m => m.status === 'critical') || anomalies[0];

    return {
      id: this.generateId(),
      type: 'anomaly_detection',
      title: `Unusual pattern detected in ${criticalAnomaly.displayName}`,
      description: `${criticalAnomaly.displayName} is showing unusual behavior with current value of ${criticalAnomaly.currentValue} ${criticalAnomaly.unit}, significantly different from expected patterns.`,
      impact: criticalAnomaly.status === 'critical' ? 'high' : 'medium',
      confidence: 0.92,
      metrics: [criticalAnomaly.id],
      dataPoints: [],
      visualizationType: 'scorecard',
      createdAt: new Date()
    };
  }

  private async generateCorrelationInsight(tenantId: string, period: { start: Date; end: Date }): Promise<ExecutiveInsight | null> {
    return {
      id: this.generateId(),
      type: 'correlation',
      title: 'Strong correlation between AUM and Revenue',
      description: 'Analysis shows a strong positive correlation (0.87) between Assets Under Management and Revenue, indicating healthy business growth.',
      impact: 'medium',
      confidence: 0.87,
      metrics: [FINANCIAL_KPIS.ASSETS_UNDER_MANAGEMENT, FINANCIAL_KPIS.REVENUE],
      dataPoints: [],
      visualizationType: 'chart',
      createdAt: new Date()
    };
  }

  private async generateBenchmarkInsight(tenantId: string, period: { start: Date; end: Date }): Promise<ExecutiveInsight | null> {
    const benchmarks = await this.getBenchmarkComparisons(tenantId);
    const significantGaps = benchmarks.filter(b => Math.abs(b.gap) > 10);

    if (significantGaps.length === 0) return null;

    const topGap = significantGaps.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0];

    return {
      id: this.generateId(),
      type: 'benchmark_comparison',
      title: `${topGap.gap > 0 ? 'Outperforming' : 'Underperforming'} industry benchmark in ${topGap.category}`,
      description: `Your ${topGap.category} performance is ${Math.abs(topGap.gap).toFixed(1)}% ${topGap.gap > 0 ? 'above' : 'below'} industry average and in the ${topGap.percentile}th percentile.`,
      impact: Math.abs(topGap.gap) > 20 ? 'high' : 'medium',
      confidence: 0.78,
      metrics: [],
      dataPoints: [
        { timestamp: new Date(), value: topGap.ourPerformance, label: 'Our Performance' },
        { timestamp: new Date(), value: topGap.industryAverage, label: 'Industry Average' },
        { timestamp: new Date(), value: topGap.topQuartile, label: 'Top Quartile' }
      ],
      visualizationType: 'chart',
      createdAt: new Date()
    };
  }

  async generateRecommendations(tenantId: string, period: { start: Date; end: Date }): Promise<ExecutiveRecommendation[]> {
    const recommendations: ExecutiveRecommendation[] = [];
    const metrics = await this.getKeyMetrics(tenantId, period);
    const benchmarks = await this.getBenchmarkComparisons(tenantId);

    const performanceGaps = benchmarks.filter(b => b.gap < -5);
    for (const gap of performanceGaps) {
      recommendations.push(await this.generatePerformanceRecommendation(gap));
    }

    const riskMetrics = metrics.filter(m => m.category === 'risk' && m.status !== 'excellent');
    for (const riskMetric of riskMetrics) {
      recommendations.push(await this.generateRiskRecommendation(riskMetric));
    }

    const growthOpportunities = metrics.filter(m => m.trend === 'up' && m.trendPercentage > 15);
    for (const opportunity of growthOpportunities) {
      recommendations.push(await this.generateGrowthRecommendation(opportunity));
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = ['high', 'medium', 'low'];
      return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
    });
  }

  private async generatePerformanceRecommendation(gap: BenchmarkComparison): Promise<ExecutiveRecommendation> {
    return {
      id: this.generateId(),
      type: 'optimization',
      priority: Math.abs(gap.gap) > 15 ? 'high' : 'medium',
      title: `Improve ${gap.category} performance`,
      description: `Your ${gap.category} performance is ${Math.abs(gap.gap).toFixed(1)}% below industry average. Focus on key improvement areas to reach competitive levels.`,
      expectedImpact: {
        metric: gap.category,
        estimatedImprovement: Math.abs(gap.gap) * 0.6,
        timeframe: '3-6 months'
      },
      actionItems: [
        {
          id: this.generateId(),
          description: `Analyze root causes of ${gap.category} underperformance`,
          status: 'pending',
          dependencies: []
        },
        {
          id: this.generateId(),
          description: 'Implement best practices from top quartile performers',
          status: 'pending',
          dependencies: []
        }
      ],
      resources: [
        {
          type: 'human',
          description: 'Dedicated project team',
          duration: 120
        },
        {
          type: 'financial',
          description: 'Process improvement initiatives',
          estimatedCost: 50000
        }
      ],
      feasibilityScore: 0.75
    };
  }

  private async generateRiskRecommendation(metric: ExecutiveMetric): Promise<ExecutiveRecommendation> {
    return {
      id: this.generateId(),
      type: 'risk_mitigation',
      priority: metric.status === 'critical' ? 'high' : 'medium',
      title: `Address elevated ${metric.displayName}`,
      description: `${metric.displayName} is currently at ${metric.currentValue} ${metric.unit}, which requires attention to maintain acceptable risk levels.`,
      expectedImpact: {
        metric: metric.name,
        estimatedImprovement: 20,
        timeframe: '1-3 months'
      },
      actionItems: [
        {
          id: this.generateId(),
          description: `Review current ${metric.displayName} management procedures`,
          status: 'pending',
          dependencies: []
        },
        {
          id: this.generateId(),
          description: 'Implement additional risk controls',
          status: 'pending',
          dependencies: []
        }
      ],
      resources: [
        {
          type: 'human',
          description: 'Risk management specialist',
          duration: 60
        }
      ],
      feasibilityScore: 0.85
    };
  }

  private async generateGrowthRecommendation(metric: ExecutiveMetric): Promise<ExecutiveRecommendation> {
    return {
      id: this.generateId(),
      type: 'growth_opportunity',
      priority: 'medium',
      title: `Capitalize on ${metric.displayName} growth`,
      description: `${metric.displayName} is showing strong growth of ${metric.trendPercentage.toFixed(1)}%. Consider expanding this successful area.`,
      expectedImpact: {
        metric: metric.name,
        estimatedImprovement: metric.trendPercentage * 0.5,
        timeframe: '6-12 months'
      },
      actionItems: [
        {
          id: this.generateId(),
          description: `Analyze success factors driving ${metric.displayName} growth`,
          status: 'pending',
          dependencies: []
        },
        {
          id: this.generateId(),
          description: 'Develop scaling strategy',
          status: 'pending',
          dependencies: []
        }
      ],
      resources: [
        {
          type: 'financial',
          description: 'Growth investment',
          estimatedCost: 100000
        }
      ],
      feasibilityScore: 0.80
    };
  }

  async calculatePerformanceSummary(tenantId: string, period: { start: Date; end: Date }): Promise<PerformanceSummary> {
    const metrics = await this.getKeyMetrics(tenantId, period);
    const benchmarks = await this.getBenchmarkComparisons(tenantId);

    const financialMetrics = metrics.filter(m => m.category === 'financial');
    const operationalMetrics = metrics.filter(m => m.category === 'operational');
    const clientMetrics = metrics.filter(m => m.name.includes('client') || m.name.includes('retention'));
    const riskMetrics = metrics.filter(m => m.category === 'risk');

    const overallScore = this.calculateCategoryScore(metrics);

    return {
      overall: {
        score: overallScore,
        grade: this.scoreToGrade(overallScore),
        trend: this.calculateOverallTrend(metrics)
      },
      categories: {
        financial: this.calculateCategoryPerformance(financialMetrics, 'financial'),
        operational: this.calculateCategoryPerformance(operationalMetrics, 'operational'),
        client: this.calculateCategoryPerformance(clientMetrics, 'client'),
        risk: this.calculateCategoryPerformance(riskMetrics, 'risk')
      },
      benchmarks
    };
  }

  private calculateCategoryPerformance(metrics: ExecutiveMetric[], category: string): CategoryPerformance {
    const score = this.calculateCategoryScore(metrics);
    const onTarget = metrics.filter(m => m.status === 'excellent' || m.status === 'good').length;
    const atRisk = metrics.filter(m => m.status === 'warning').length;
    const offTrack = metrics.filter(m => m.status === 'critical').length;

    const improvingCount = metrics.filter(m => m.trend === 'up').length;
    const decliningCount = metrics.filter(m => m.trend === 'down').length;
    
    let trend: 'improving' | 'stable' | 'declining';
    if (improvingCount > decliningCount) trend = 'improving';
    else if (decliningCount > improvingCount) trend = 'declining';
    else trend = 'stable';

    return {
      score,
      metrics: {
        total: metrics.length,
        onTarget,
        atRisk,
        offTrack
      },
      trend,
      keyDrivers: metrics
        .filter(m => Math.abs(m.trendPercentage) > 10)
        .map(m => m.displayName)
        .slice(0, 3)
    };
  }

  private calculateCategoryScore(metrics: ExecutiveMetric[]): number {
    if (metrics.length === 0) return 0;

    const scores = metrics.map(metric => {
      switch (metric.status) {
        case 'excellent': return 100;
        case 'good': return 80;
        case 'warning': return 60;
        case 'critical': return 40;
        default: return 0;
      }
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private calculateOverallTrend(metrics: ExecutiveMetric[]): 'improving' | 'stable' | 'declining' {
    const trendSum = metrics.reduce((sum, metric) => {
      if (metric.trend === 'up') return sum + 1;
      if (metric.trend === 'down') return sum - 1;
      return sum;
    }, 0);

    if (trendSum > 0) return 'improving';
    if (trendSum < 0) return 'declining';
    return 'stable';
  }

  async drillDown(context: DrillDownContext): Promise<DrillDownResult> {
    const data = await this.getDrillDownData(context);
    const aggregations = this.calculateDrillDownAggregations(data);
    const insights = this.generateDrillDownInsights(data);
    const nextLevelDimensions = this.getNextLevelDimensions(context.dimension);

    return {
      context,
      data,
      aggregations,
      insights,
      nextLevelDimensions
    };
  }

  private async getDrillDownData(context: DrillDownContext): Promise<DrillDownData[]> {
    const mockData: DrillDownData[] = [
      { dimension: 'Region', value: 'North America', metric: 45.2, contribution: 0.452, trend: 5.3, rank: 1 },
      { dimension: 'Region', value: 'Europe', metric: 32.1, contribution: 0.321, trend: -2.1, rank: 2 },
      { dimension: 'Region', value: 'Asia Pacific', metric: 22.7, contribution: 0.227, trend: 8.7, rank: 3 }
    ];

    return mockData;
  }

  private calculateDrillDownAggregations(data: DrillDownData[]): DrillDownAggregation[] {
    return [
      { type: 'sum', value: data.reduce((sum, d) => sum + d.metric, 0), label: 'Total' },
      { type: 'avg', value: data.reduce((sum, d) => sum + d.metric, 0) / data.length, label: 'Average' },
      { type: 'max', value: Math.max(...data.map(d => d.metric)), label: 'Maximum' },
      { type: 'min', value: Math.min(...data.map(d => d.metric)), label: 'Minimum' },
      { type: 'count', value: data.length, label: 'Count' }
    ];
  }

  private generateDrillDownInsights(data: DrillDownData[]): string[] {
    const insights: string[] = [];
    
    const topPerformer = data.sort((a, b) => b.metric - a.metric)[0];
    if (topPerformer) {
      insights.push(`${topPerformer.value} is the top performer with ${topPerformer.metric.toFixed(1)} (${(topPerformer.contribution * 100).toFixed(1)}% of total)`);
    }

    const strongestGrowth = data.sort((a, b) => b.trend - a.trend)[0];
    if (strongestGrowth && strongestGrowth.trend > 0) {
      insights.push(`${strongestGrowth.value} shows strongest growth at ${strongestGrowth.trend.toFixed(1)}%`);
    }

    return insights;
  }

  private getNextLevelDimensions(currentDimension: string): string[] {
    const dimensionHierarchy: Record<string, string[]> = {
      'total': ['region', 'product', 'client_segment'],
      'region': ['country', 'office', 'advisor'],
      'product': ['asset_class', 'strategy', 'fund'],
      'client_segment': ['client_type', 'age_group', 'risk_profile']
    };

    return dimensionHierarchy[currentDimension.toLowerCase()] || [];
  }

  private async calculateAUM(tenantId: string, period: { start: Date; end: Date }) {
    return {
      current: 2500000000 + Math.random() * 100000000,
      previous: 2400000000 + Math.random() * 100000000,
      target: 2600000000
    };
  }

  private async calculateRevenue(tenantId: string, period: { start: Date; end: Date }) {
    return {
      current: 12500000 + Math.random() * 1000000,
      previous: 11800000 + Math.random() * 1000000,
      target: 13000000
    };
  }

  private async calculateNetFlows(tenantId: string, period: { start: Date; end: Date }) {
    return {
      current: 25000000 + Math.random() * 5000000,
      previous: 20000000 + Math.random() * 5000000,
      target: 30000000
    };
  }

  private async calculateSystemUptime(tenantId: string, period: { start: Date; end: Date }) {
    return {
      current: 99.95 + Math.random() * 0.05,
      previous: 99.92 + Math.random() * 0.05
    };
  }

  private async calculateTradeExecutionTime(tenantId: string, period: { start: Date; end: Date }) {
    return {
      current: 1500 + Math.random() * 500,
      previous: 1600 + Math.random() * 500
    };
  }

  private async calculateClientCount(tenantId: string, period: { start: Date; end: Date }) {
    return {
      current: 1250 + Math.floor(Math.random() * 100),
      previous: 1200 + Math.floor(Math.random() * 100)
    };
  }

  private async calculateRetentionRate(tenantId: string, period: { start: Date; end: Date }) {
    return {
      current: 94.5 + Math.random() * 3,
      previous: 93.8 + Math.random() * 3
    };
  }

  private async calculatePortfolioVaR(tenantId: string, period: { start: Date; end: Date }) {
    return {
      current: 0.018 + Math.random() * 0.008,
      previous: 0.016 + Math.random() * 0.008
    };
  }

  private async getBenchmarkComparisons(tenantId: string): Promise<BenchmarkComparison[]> {
    return [
      {
        category: 'AUM Growth',
        ourPerformance: 8.5,
        industryAverage: 7.2,
        topQuartile: 12.1,
        percentile: 68,
        gap: 1.3
      },
      {
        category: 'Client Retention',
        ourPerformance: 94.5,
        industryAverage: 91.8,
        topQuartile: 96.2,
        percentile: 72,
        gap: 2.7
      },
      {
        category: 'Operating Margin',
        ourPerformance: 23.2,
        industryAverage: 26.5,
        topQuartile: 32.1,
        percentile: 42,
        gap: -3.3
      }
    ];
  }

  private calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    const diff = current - previous;
    const threshold = Math.abs(previous) * 0.01;
    
    if (Math.abs(diff) < threshold) return 'stable';
    return diff > 0 ? 'up' : 'down';
  }

  private calculateTrendPercentage(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  private calculateStatus(current: number, target?: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (!target) return 'good';
    
    const ratio = current / target;
    
    if (ratio >= 1.1) return 'excellent';
    if (ratio >= 0.95) return 'good';
    if (ratio >= 0.85) return 'warning';
    return 'critical';
  }

  private calculateGrowthStatus(current: number, previous: number): 'excellent' | 'good' | 'warning' | 'critical' {
    const growth = this.calculateTrendPercentage(current, previous);
    
    if (growth >= 10) return 'excellent';
    if (growth >= 5) return 'good';
    if (growth >= 0) return 'warning';
    return 'critical';
  }

  private calculateRiskStatus(current: number, threshold: number): 'excellent' | 'good' | 'warning' | 'critical' {
    const ratio = current / threshold;
    
    if (ratio <= 0.5) return 'excellent';
    if (ratio <= 0.75) return 'good';
    if (ratio <= 1.0) return 'warning';
    return 'critical';
  }

  private async getExecutiveAlerts(tenantId: string): Promise<ExecutiveAlert[]> {
    return [
      {
        id: this.generateId(),
        type: 'risk',
        severity: 'medium',
        title: 'Portfolio VaR approaching threshold',
        description: 'Portfolio Value at Risk has increased to 1.8%, approaching the 2.0% limit.',
        affectedMetrics: [RISK_KPIS.PORTFOLIO_VAR],
        triggeredAt: new Date(Date.now() - 3600000),
        expectedResolution: new Date(Date.now() + 86400000),
        actionRequired: true,
        context: { threshold: 0.02, current: 0.018 }
      }
    ];
  }

  private initializeExecutiveMetrics(): void {
    this.emit('executiveMetricsInitialized');
  }

  private startReportingTimer(): void {
    this.reportingTimer = setInterval(() => {
      this.performScheduledReporting();
    }, this.config.refreshInterval);
  }

  private startCacheCleanup(): void {
    this.cacheCleanupTimer = setInterval(() => {
      this.cleanupCache();
    }, 3600000);
  }

  private async performScheduledReporting(): Promise<void> {
    this.emit('scheduledReportingStarted');
  }

  private cleanupCache(): void {
    const cutoff = Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000);
    
    for (const [key, summary] of this.summaryCache) {
      if (summary.generatedAt.getTime() < cutoff) {
        this.summaryCache.delete(key);
      }
    }
  }

  private generateId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getExecutiveSummary(summaryId: string): ExecutiveSummary | null {
    for (const summary of this.summaryCache.values()) {
      if (summary.id === summaryId) {
        return summary;
      }
    }
    return null;
  }

  getExecutiveMetric(metricId: string): ExecutiveMetric | null {
    return this.executiveMetrics.get(metricId) || null;
  }

  async shutdown(): Promise<void> {
    clearInterval(this.reportingTimer);
    clearInterval(this.cacheCleanupTimer);
    this.emit('shutdown');
  }
}
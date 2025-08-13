export enum AnalyticsMetricType {
  PORTFOLIO_PERFORMANCE = 'PORTFOLIO_PERFORMANCE',
  ASSET_ALLOCATION = 'ASSET_ALLOCATION',
  RISK_METRICS = 'RISK_METRICS',
  SECTOR_ANALYSIS = 'SECTOR_ANALYSIS',
  GEOGRAPHIC_ANALYSIS = 'GEOGRAPHIC_ANALYSIS',
  MARKET_EXPOSURE = 'MARKET_EXPOSURE',
  CORRELATION_ANALYSIS = 'CORRELATION_ANALYSIS',
  ATTRIBUTION_ANALYSIS = 'ATTRIBUTION_ANALYSIS',
  CONCENTRATION_ANALYSIS = 'CONCENTRATION_ANALYSIS',
  LIQUIDITY_ANALYSIS = 'LIQUIDITY_ANALYSIS'
}

export enum VisualizationType {
  LINE_CHART = 'LINE_CHART',
  BAR_CHART = 'BAR_CHART',
  PIE_CHART = 'PIE_CHART',
  DONUT_CHART = 'DONUT_CHART',
  SCATTER_PLOT = 'SCATTER_PLOT',
  HEATMAP = 'HEATMAP',
  TREEMAP = 'TREEMAP',
  BUBBLE_CHART = 'BUBBLE_CHART',
  CANDLESTICK = 'CANDLESTICK',
  AREA_CHART = 'AREA_CHART',
  WATERFALL = 'WATERFALL',
  GAUGE = 'GAUGE'
}

export enum AggregationPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM'
}

export enum DrillDownLevel {
  PORTFOLIO = 'PORTFOLIO',
  ASSET_CLASS = 'ASSET_CLASS',
  SECTOR = 'SECTOR',
  INDUSTRY = 'INDUSTRY',
  SECURITY = 'SECURITY',
  POSITION = 'POSITION'
}

export interface AnalyticsDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
  drillDownData?: AnalyticsDataPoint[];
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  type: AnalyticsMetricType;
  value: number;
  previousValue?: number;
  changeValue?: number;
  changePercent?: number;
  unit?: string;
  description?: string;
  calculationMethod?: string;
  lastUpdated: Date;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface AnalyticsVisualization {
  id: string;
  title: string;
  description?: string;
  type: VisualizationType;
  metricType: AnalyticsMetricType;
  data: AnalyticsDataPoint[];
  configuration: {
    xAxis?: {
      label: string;
      type: 'category' | 'time' | 'value';
      format?: string;
    };
    yAxis?: {
      label: string;
      type: 'linear' | 'logarithmic';
      format?: string;
      min?: number;
      max?: number;
    };
    colors?: string[];
    showLegend?: boolean;
    showTooltip?: boolean;
    interactive?: boolean;
    drillDownEnabled?: boolean;
    aggregationPeriod?: AggregationPeriod;
  };
  filters?: AnalyticsFilter[];
  dimensions?: AnalyticsDimension[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsDashboard {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isTemplate: boolean;
  visualizations: AnalyticsDashboardVisualization[];
  layout: {
    rows: number;
    columns: number;
    gridSize: number;
  };
  filters: AnalyticsFilter[];
  refreshInterval?: number;
  createdBy: string;
  sharedWith?: string[];
  permissions: {
    canEdit: boolean;
    canShare: boolean;
    canDelete: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsDashboardVisualization {
  id: string;
  visualizationId: string;
  position: {
    row: number;
    column: number;
    width: number;
    height: number;
  };
  overrideTitle?: string;
  overrideConfiguration?: Partial<AnalyticsVisualization['configuration']>;
  filters?: AnalyticsFilter[];
}

export interface AnalyticsFilter {
  id: string;
  name: string;
  type: 'date_range' | 'category' | 'numeric_range' | 'boolean' | 'multi_select';
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'contains';
  value: any;
  displayName?: string;
  required?: boolean;
}

export interface AnalyticsDimension {
  id: string;
  name: string;
  field: string;
  type: 'category' | 'time' | 'numeric';
  drillDownLevels?: DrillDownLevel[];
  aggregationMethods?: ('sum' | 'average' | 'count' | 'min' | 'max')[];
}

export interface AnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: AnalyticsFilter[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  aggregationPeriod?: AggregationPeriod;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AnalyticsQueryResult {
  data: AnalyticsDataPoint[];
  metrics: AnalyticsMetric[];
  totalCount: number;
  executionTime: number;
  query: AnalyticsQuery;
  generatedAt: Date;
}

export interface RealTimeAnalyticsEvent {
  id: string;
  tenantId: string;
  eventType: 'metric_update' | 'threshold_breach' | 'anomaly_detected' | 'data_refresh';
  metricType: AnalyticsMetricType;
  entityId: string;
  entityType: 'portfolio' | 'position' | 'client' | 'tenant';
  timestamp: Date;
  data: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface PredictiveModel {
  id: string;
  name: string;
  description: string;
  modelType: 'regression' | 'classification' | 'time_series' | 'clustering' | 'deep_learning';
  algorithm: string;
  targetVariable: string;
  features: string[];
  hyperparameters: Record<string, any>;
  performance: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    mae?: number;
    r2?: number;
  };
  trainingData: {
    startDate: Date;
    endDate: Date;
    recordCount: number;
  };
  lastTrainingDate: Date;
  nextTrainingDate?: Date;
  status: 'training' | 'ready' | 'deprecated' | 'failed';
  version: string;
  createdBy: string;
  createdAt: Date;
}

export interface PredictiveInsight {
  id: string;
  modelId: string;
  entityId: string;
  entityType: 'portfolio' | 'position' | 'client';
  predictionType: 'performance' | 'risk' | 'allocation' | 'volatility' | 'correlation';
  prediction: {
    value: number;
    confidence: number;
    confidenceInterval?: {
      lower: number;
      upper: number;
    };
    horizon: number;
    unit: 'days' | 'weeks' | 'months' | 'years';
  };
  features: Record<string, number>;
  explanation?: {
    topFactors: {
      feature: string;
      impact: number;
      direction: 'positive' | 'negative';
    }[];
    shap_values?: Record<string, number>;
  };
  generatedAt: Date;
  validUntil: Date;
}

export interface AnomalyDetection {
  id: string;
  entityId: string;
  entityType: 'portfolio' | 'position' | 'market';
  metricType: AnalyticsMetricType;
  anomalyType: 'statistical' | 'seasonal' | 'trend' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectionMethod: 'isolation_forest' | 'one_class_svm' | 'local_outlier_factor' | 'statistical_threshold' | 'lstm_autoencoder';
  anomalyScore: number;
  threshold: number;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  context: {
    historicalMean: number;
    historicalStdDev: number;
    recentTrend: 'increasing' | 'decreasing' | 'stable';
    seasonalPattern?: string;
  };
  rootCause?: {
    primaryFactor: string;
    contributingFactors: string[];
    confidence: number;
  };
  recommendedActions?: string[];
  detectedAt: Date;
  resolvedAt?: Date;
  falsePositive?: boolean;
}

export interface MachineLearningInsight {
  id: string;
  type: 'cluster_analysis' | 'pattern_recognition' | 'optimization_suggestion' | 'risk_attribution' | 'performance_driver';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: 'performance' | 'risk' | 'allocation' | 'cost' | 'opportunity';
  entities: {
    portfolios?: string[];
    positions?: string[];
    clients?: string[];
  };
  insights: {
    key: string;
    value: any;
    explanation: string;
  }[];
  recommendations: {
    action: string;
    reasoning: string;
    expectedImpact: string;
    priority: 'low' | 'medium' | 'high';
  }[];
  supportingData: Record<string, any>;
  modelUsed?: string;
  generatedAt: Date;
  validUntil?: Date;
  actionTaken?: {
    action: string;
    takenAt: Date;
    takenBy: string;
    outcome?: string;
  };
}

export interface BusinessIntelligenceReport {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: 'executive_summary' | 'performance_analysis' | 'risk_assessment' | 'client_analysis' | 'market_intelligence';
  reportType: 'scheduled' | 'on_demand' | 'triggered';
  visualizations: string[];
  metrics: AnalyticsMetric[];
  insights: MachineLearningInsight[];
  keyFindings: {
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }[];
  recommendations: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    timeframe: string;
    assignedTo?: string;
  }[];
  generatedAt: Date;
  periodCovered: {
    startDate: Date;
    endDate: Date;
  };
  recipients: string[];
  deliveryMethod: 'email' | 'portal' | 'api' | 'export';
  format: 'pdf' | 'html' | 'excel' | 'json';
}

export interface AnalyticsConfiguration {
  tenantId: string;
  realTimeEnabled: boolean;
  refreshIntervals: {
    metrics: number;
    visualizations: number;
    dashboards: number;
    predictions: number;
  };
  dataRetention: {
    rawData: number;
    aggregatedData: number;
    predictions: number;
    anomalies: number;
  };
  machineLearning: {
    enabled: boolean;
    autoRetrain: boolean;
    retrainFrequency: number;
    predictionHorizon: number;
    confidenceThreshold: number;
  };
  anomalyDetection: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    methods: string[];
    alertThreshold: number;
  };
  businessIntelligence: {
    enabled: boolean;
    autoGenerateReports: boolean;
    reportFrequency: string;
    insightCategories: string[];
  };
  integrations: {
    externalDataSources?: {
      name: string;
      type: string;
      configuration: Record<string, any>;
    }[];
    exportTargets?: {
      name: string;
      type: string;
      configuration: Record<string, any>;
    }[];
  };
}

export interface AnalyticsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    executionTime?: number;
    cached?: boolean;
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface DrillDownRequest {
  visualizationId: string;
  dataPointId: string;
  level: DrillDownLevel;
  filters?: AnalyticsFilter[];
}

export interface DrillDownResponse {
  level: DrillDownLevel;
  data: AnalyticsDataPoint[];
  breadcrumb: {
    level: DrillDownLevel;
    label: string;
    value: any;
  }[];
  availableLevels: DrillDownLevel[];
}
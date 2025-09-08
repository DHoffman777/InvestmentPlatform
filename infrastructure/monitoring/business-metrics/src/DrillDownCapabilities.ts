import { EventEmitter } from 'events';
import {
  MetricValue,
  MetricDefinition,
  BusinessKPI,
  TimeInterval
} from './BusinessMetricsDataModel';

export interface DrillDownPath {
  id: string;
  name: string;
  levels: DrillDownLevel[];
  metricIds: string[];
  isDefault: boolean;
  createdAt: Date;
}

export interface DrillDownLevel {
  id: string;
  name: string;
  displayName: string;
  dimension: string;
  order: number;
  aggregationMethod: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';
  filters?: DrillDownFilter[];
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  maxResults?: number;
}

export interface DrillDownFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';
  value: any;
  isRequired: boolean;
}

export interface DrillDownContext {
  pathId: string;
  currentLevel: number;
  selectedValues: Record<string, string>;
  timeRange: {
    start: Date;
    end: Date;
    interval: TimeInterval;
  };
  filters: Record<string, any>;
  userId: string;
  tenantId: string;
}

export interface DrillDownResult {
  context: DrillDownContext;
  level: DrillDownLevel;
  data: DrillDownDataPoint[];
  aggregations: DrillDownAggregation[];
  metadata: DrillDownMetadata;
  nextLevel?: DrillDownLevel;
  breadcrumbs: DrillDownBreadcrumb[];
  recommendations: DrillDownRecommendation[];
}

export interface DrillDownDataPoint {
  id: string;
  dimension: string;
  label: string;
  value: number;
  formattedValue: string;
  percentage: number;
  rank: number;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  comparison: {
    previous: number;
    target?: number;
    benchmark?: number;
  };
  metadata: Record<string, any>;
  children?: number;
  isExpandable: boolean;
}

export interface DrillDownAggregation {
  type: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median' | 'percentile';
  value: number;
  formattedValue: string;
  label: string;
  description?: string;
}

export interface DrillDownMetadata {
  totalRecords: number;
  filteredRecords: number;
  processingTime: number;
  dataFreshness: Date;
  confidence: number;
  warnings: string[];
  nextRefresh?: Date;
}

export interface DrillDownBreadcrumb {
  level: number;
  name: string;
  value: string;
  isClickable: boolean;
}

export interface DrillDownRecommendation {
  type: 'outlier' | 'trend' | 'opportunity' | 'risk';
  title: string;
  description: string;
  dataPoints: string[];
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface DrillDownQuery {
  metricId: string;
  dimensions: string[];
  timeRange: {
    start: Date;
    end: Date;
    granularity: TimeInterval;
  };
  filters: Record<string, any>;
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';
  groupBy: string[];
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

export interface DrillDownCache {
  key: string;
  result: DrillDownResult;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
  lastAccessed: Date;
}

export interface DrillDownSession {
  id: string;
  userId: string;
  tenantId: string;
  startedAt: Date;
  lastActivity: Date;
  currentContext: DrillDownContext;
  history: DrillDownContext[];
  bookmarks: DrillDownBookmark[];
  preferences: DrillDownPreferences;
}

export interface DrillDownBookmark {
  id: string;
  name: string;
  description?: string;
  context: DrillDownContext;
  createdAt: Date;
  isShared: boolean;
  tags: string[];
}

export interface DrillDownPreferences {
  defaultTimeRange: string;
  defaultAggregation: string;
  autoRefresh: boolean;
  refreshInterval: number;
  maxResultsPerLevel: number;
  showTrends: boolean;
  showComparisons: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export class DrillDownCapabilities extends EventEmitter {
  private drillDownPaths: Map<string, DrillDownPath> = new Map();
  private sessions: Map<string, DrillDownSession> = new Map();
  private cache: Map<string, DrillDownCache> = new Map();
  private queryEngine: DrillDownQueryEngine;
  private aggregationEngine: AggregationEngine;
  private insightEngine: InsightEngine;
  private cacheCleanupTimer?: NodeJS.Timeout;

  constructor() {
    super();
    this.queryEngine = new DrillDownQueryEngine();
    this.aggregationEngine = new AggregationEngine();
    this.insightEngine = new InsightEngine();
    this.initializeDefaultPaths();
    this.startCacheCleanup();
  }

  async createDrillDownPath(path: Partial<DrillDownPath>): Promise<DrillDownPath> {
    const newPath: DrillDownPath = {
      id: path.id || this.generateId(),
      name: path.name!,
      levels: path.levels || [],
      metricIds: path.metricIds || [],
      isDefault: path.isDefault || false,
      createdAt: new Date()
    };

    await this.validateDrillDownPath(newPath);
    this.drillDownPaths.set(newPath.id, newPath);
    
    this.emit('drillDownPathCreated', { pathId: newPath.id });
    return newPath;
  }

  async startDrillDownSession(
    userId: string,
    tenantId: string,
    pathId: string,
    initialContext?: Partial<DrillDownContext>
  ): Promise<DrillDownSession> {
    const path = this.drillDownPaths.get(pathId);
    if (!path) {
      throw new Error(`Drill-down path ${pathId} not found`);
    }

    const session: DrillDownSession = {
      id: this.generateId(),
      userId,
      tenantId,
      startedAt: new Date(),
      lastActivity: new Date(),
      currentContext: {
        pathId,
        currentLevel: 0,
        selectedValues: {},
        timeRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
          interval: TimeInterval.DAY
        },
        filters: {},
        userId,
        tenantId,
        ...initialContext
      },
      history: [],
      bookmarks: [],
      preferences: this.getDefaultPreferences()
    };

    this.sessions.set(session.id, session);
    this.emit('drillDownSessionStarted', { sessionId: session.id, userId, pathId });
    
    return session;
  }

  async performDrillDown(sessionId: string, context: Partial<DrillDownContext>): Promise<DrillDownResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Drill-down session ${sessionId} not found`);
    }

    const updatedContext = { ...session.currentContext, ...context };
    const cacheKey = this.generateCacheKey(updatedContext);

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (cached.expiresAt > new Date()) {
        cached.hitCount++;
        cached.lastAccessed = new Date();
        this.emit('drillDownCacheHit', { sessionId, cacheKey });
        return cached.result;
      }
    }

    session.history.push(session.currentContext);
    session.currentContext = updatedContext;
    session.lastActivity = new Date();

    const result = await this.executeDrillDown(updatedContext);
    
    if (result.metadata.confidence > 0.8) {
      this.cacheResult(cacheKey, result);
    }

    this.emit('drillDownPerformed', { 
      sessionId, 
      level: result.level.name, 
      dataPoints: result.data.length 
    });

    return result;
  }

  private async executeDrillDown(context: DrillDownContext): Promise<DrillDownResult> {
    const startTime = Date.now();
    const path = this.drillDownPaths.get(context.pathId);
    if (!path) {
      throw new Error(`Drill-down path ${context.pathId} not found`);
    }

    const currentLevel = path.levels[context.currentLevel];
    if (!currentLevel) {
      throw new Error(`Invalid drill-down level ${context.currentLevel}`);
    }

    const query = this.buildDrillDownQuery(context, currentLevel, path);
    const rawData = await this.queryEngine.execute(query);
    const processedData = await this.processRawData(rawData, currentLevel, context);
    const aggregations = await this.aggregationEngine.calculate(processedData, currentLevel);
    const recommendations = await this.insightEngine.generateRecommendations(processedData, currentLevel);

    const nextLevel = context.currentLevel < path.levels.length - 1 
      ? path.levels[context.currentLevel + 1] 
      : undefined;

    const breadcrumbs = this.buildBreadcrumbs(context, path);
    const processingTime = Date.now() - startTime;

    return {
      context,
      level: currentLevel,
      data: processedData,
      aggregations,
      metadata: {
        totalRecords: rawData.length,
        filteredRecords: processedData.length,
        processingTime,
        dataFreshness: new Date(),
        confidence: this.calculateConfidence(processedData),
        warnings: [],
        nextRefresh: new Date(Date.now() + 300000)
      },
      nextLevel,
      breadcrumbs,
      recommendations
    };
  }

  private buildDrillDownQuery(
    context: DrillDownContext,
    level: DrillDownLevel,
    path: DrillDownPath
  ): DrillDownQuery {
    return {
      metricId: path.metricIds[0],
      dimensions: [level.dimension],
      timeRange: {
        start: context.timeRange.start,
        end: context.timeRange.end,
        granularity: context.timeRange.interval
      },
      filters: { ...context.filters, ...context.selectedValues },
      aggregation: level.aggregationMethod,
      groupBy: [level.dimension],
      orderBy: {
        field: level.sortBy || 'value',
        direction: level.sortOrder
      },
      limit: level.maxResults || 50
    };
  }

  private async processRawData(
    rawData: any[],
    level: DrillDownLevel,
    context: DrillDownContext
  ): Promise<DrillDownDataPoint[]> {
    const totalValue = rawData.reduce((sum, item) => sum + (item.value || 0), 0);
    
    return rawData.map((item, index) => {
      const value = item.value || 0;
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
      
      return {
        id: item.id || `${level.dimension}_${index}`,
        dimension: level.dimension,
        label: item.label || item[level.dimension] || `Unknown ${index + 1}`,
        value,
        formattedValue: this.formatValue(value, 'currency'),
        percentage,
        rank: index + 1,
        trend: {
          direction: this.calculateTrendDirection(item),
          percentage: this.calculateTrendPercentage(item),
          period: '30d'
        },
        comparison: {
          previous: item.previousValue || 0,
          target: item.target,
          benchmark: item.benchmark
        },
        metadata: item.metadata || {},
        children: item.childCount || 0,
        isExpandable: context.currentLevel < (this.drillDownPaths.get(context.pathId)?.levels.length || 0) - 1
      };
    });
  }

  private buildBreadcrumbs(context: DrillDownContext, path: DrillDownPath): DrillDownBreadcrumb[] {
    const breadcrumbs: DrillDownBreadcrumb[] = [];
    
    breadcrumbs.push({
      level: -1,
      name: 'All',
      value: 'All',
      isClickable: true
    });

    for (let i = 0; i <= context.currentLevel; i++) {
      const level = path.levels[i];
      const selectedValue = context.selectedValues[level.dimension] || 'All';
      
      breadcrumbs.push({
        level: i,
        name: level.displayName,
        value: selectedValue,
        isClickable: i < context.currentLevel
      });
    }

    return breadcrumbs;
  }

  async navigateToLevel(sessionId: string, targetLevel: number, selectedValue?: string): Promise<DrillDownResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const path = this.drillDownPaths.get(session.currentContext.pathId);
    if (!path || targetLevel >= path.levels.length) {
      throw new Error(`Invalid target level ${targetLevel}`);
    }

    const updatedContext = { ...session.currentContext };
    updatedContext.currentLevel = targetLevel;

    if (selectedValue && targetLevel > 0) {
      const level = path.levels[targetLevel - 1];
      updatedContext.selectedValues[level.dimension] = selectedValue;
    }

    return await this.performDrillDown(sessionId, updatedContext);
  }

  async navigateBack(sessionId: string): Promise<DrillDownResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.history.length === 0) {
      throw new Error('No navigation history available');
    }

    const previousContext = session.history.pop()!;
    return await this.performDrillDown(sessionId, previousContext);
  }

  async createBookmark(
    sessionId: string,
    name: string,
    description?: string,
    isShared: boolean = false,
    tags: string[] = []
  ): Promise<DrillDownBookmark> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const bookmark: DrillDownBookmark = {
      id: this.generateId(),
      name,
      description,
      context: { ...session.currentContext },
      createdAt: new Date(),
      isShared,
      tags
    };

    session.bookmarks.push(bookmark);
    this.emit('bookmarkCreated', { sessionId, bookmarkId: bookmark.id });
    
    return bookmark;
  }

  async loadBookmark(sessionId: string, bookmarkId: string): Promise<DrillDownResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const bookmark = session.bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) {
      throw new Error(`Bookmark ${bookmarkId} not found`);
    }

    return await this.performDrillDown(sessionId, bookmark.context);
  }

  async exportDrillDownData(
    sessionId: string,
    format: 'csv' | 'excel' | 'json' | 'pdf',
    options: {
      includeMetadata?: boolean;
      includeAggregations?: boolean;
      includeRecommendations?: boolean;
    } = {}
  ): Promise<ExportResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const result = await this.performDrillDown(sessionId, session.currentContext);
    
    const exportData = {
      context: result.context,
      data: result.data,
      ...(options.includeMetadata && { metadata: result.metadata }),
      ...(options.includeAggregations && { aggregations: result.aggregations }),
      ...(options.includeRecommendations && { recommendations: result.recommendations })
    };

    const exportResult: ExportResult = {
      id: this.generateId(),
      format,
      filename: `drilldown_${result.level.name}_${Date.now()}.${format}`,
      data: this.formatExportData(exportData, format),
      size: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    exportResult.size = exportResult.data.length;
    this.emit('dataExported', { sessionId, exportId: exportResult.id, format });
    
    return exportResult;
  }

  private formatExportData(data: any, format: string): string {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data.data);
      default:
        return JSON.stringify(data);
    }
  }

  private convertToCSV(data: DrillDownDataPoint[]): string {
    if (data.length === 0) return '';
    
    const headers = ['Dimension', 'Label', 'Value', 'Percentage', 'Rank', 'Trend Direction', 'Trend %'];
    const rows = data.map(item => [
      item.dimension,
      item.label,
      item.value.toString(),
      item.percentage.toFixed(2),
      item.rank.toString(),
      item.trend.direction,
      item.trend.percentage.toFixed(2)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private async validateDrillDownPath(path: DrillDownPath): Promise<any> {
    if (!path.name || path.name.trim().length === 0) {
      throw new Error('Drill-down path name is required');
    }

    if (path.levels.length === 0) {
      throw new Error('Drill-down path must have at least one level');
    }

    if (path.metricIds.length === 0) {
      throw new Error('Drill-down path must specify at least one metric');
    }

    const dimensionNames = new Set();
    path.levels.forEach((level, index) => {
      if (dimensionNames.has(level.dimension)) {
        throw new Error(`Duplicate dimension '${level.dimension}' in path levels`);
      }
      dimensionNames.add(level.dimension);
      
      if (level.order !== index) {
        throw new Error(`Level order mismatch at index ${index}`);
      }
    });
  }

  private calculateTrendDirection(item: any): 'up' | 'down' | 'stable' {
    const current = item.value || 0;
    const previous = item.previousValue || 0;
    const threshold = Math.abs(previous) * 0.01;
    
    if (Math.abs(current - previous) < threshold) return 'stable';
    return current > previous ? 'up' : 'down';
  }

  private calculateTrendPercentage(item: any): number {
    const current = item.value || 0;
    const previous = item.previousValue || 0;
    
    if (previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  private formatValue(value: number, type: string): string {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      default:
        return value.toLocaleString();
    }
  }

  private calculateConfidence(data: DrillDownDataPoint[]): number {
    const dataQualityFactors = [
      data.length > 0 ? 0.3 : 0,
      data.every(d => d.value >= 0) ? 0.2 : 0,
      data.some(d => d.trend.direction !== 'stable') ? 0.3 : 0.1,
      data.every(d => d.metadata && Object.keys(d.metadata).length > 0) ? 0.2 : 0.1
    ];
    
    return Math.min(1.0, dataQualityFactors.reduce((sum, factor) => sum + factor, 0));
  }

  private generateCacheKey(context: DrillDownContext): string {
    const keyParts = [
      context.pathId,
      context.currentLevel.toString(),
      JSON.stringify(context.selectedValues),
      context.timeRange.start.toISOString(),
      context.timeRange.end.toISOString(),
      context.timeRange.interval,
      JSON.stringify(context.filters)
    ];
    
    return Buffer.from(keyParts.join('|')).toString('base64');
  }

  private cacheResult(key: string, result: DrillDownResult): void {
    const cache: DrillDownCache = {
      key,
      result,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 300000),
      hitCount: 0,
      lastAccessed: new Date()
    };
    
    this.cache.set(key, cache);
  }

  private initializeDefaultPaths(): void {
    const financialPath: DrillDownPath = {
      id: 'financial_performance',
      name: 'Financial Performance',
      levels: [
        {
          id: 'region_level',
          name: 'region',
          displayName: 'Region',
          dimension: 'region',
          order: 0,
          aggregationMethod: 'sum',
          sortBy: 'value',
          sortOrder: 'desc',
          maxResults: 10
        },
        {
          id: 'office_level',
          name: 'office',
          displayName: 'Office',
          dimension: 'office',
          order: 1,
          aggregationMethod: 'sum',
          sortBy: 'value',
          sortOrder: 'desc',
          maxResults: 20
        },
        {
          id: 'advisor_level',
          name: 'advisor',
          displayName: 'Advisor',
          dimension: 'advisor',
          order: 2,
          aggregationMethod: 'sum',
          sortBy: 'value',
          sortOrder: 'desc',
          maxResults: 50
        }
      ],
      metricIds: ['revenue', 'aum'],
      isDefault: true,
      createdAt: new Date()
    };

    this.drillDownPaths.set(financialPath.id, financialPath);
  }

  private getDefaultPreferences(): DrillDownPreferences {
    return {
      defaultTimeRange: '30d',
      defaultAggregation: 'sum',
      autoRefresh: false,
      refreshInterval: 300000,
      maxResultsPerLevel: 50,
      showTrends: true,
      showComparisons: true,
      theme: 'light'
    };
  }

  private startCacheCleanup(): void {
    this.cacheCleanupTimer = setInterval(() => {
      const now = new Date();
      for (const [key, cache] of this.cache) {
        if (cache.expiresAt < now) {
          this.cache.delete(key);
        }
      }
    }, 60000);
  }

  private generateId(): string {
    return `dd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDrillDownPath(pathId: string): DrillDownPath | null {
    return this.drillDownPaths.get(pathId) || null;
  }

  getDrillDownPaths(): DrillDownPath[] {
    return Array.from(this.drillDownPaths.values());
  }

  getSession(sessionId: string): DrillDownSession | null {
    return this.sessions.get(sessionId) || null;
  }

  async endSession(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      this.emit('sessionEnded', { sessionId, duration: Date.now() - session.startedAt.getTime() });
    }
  }

  getCacheStats(): any {
    const caches = Array.from(this.cache.values());
    return {
      totalEntries: caches.length,
      totalHits: caches.reduce((sum, cache) => sum + cache.hitCount, 0),
      avgHits: caches.length > 0 ? caches.reduce((sum, cache) => sum + cache.hitCount, 0) / caches.length : 0,
      memoryUsage: JSON.stringify(caches).length
    };
  }

  async shutdown(): Promise<any> {
    clearInterval(this.cacheCleanupTimer);
    this.cache.clear();
    this.sessions.clear();
    this.emit('shutdown');
  }
}

class DrillDownQueryEngine {
  async execute(query: DrillDownQuery): Promise<any[]> {
    const mockData = this.generateMockData(query);
    return mockData;
  }

  private generateMockData(query: DrillDownQuery): any[] {
    const data: any[] = [];
    const dimensionValues = this.getDimensionValues(query.dimensions[0]);
    
    dimensionValues.forEach((value, index) => {
      data.push({
        id: `${query.dimensions[0]}_${index}`,
        [query.dimensions[0]]: value,
        label: value,
        value: Math.random() * 1000000 + 100000,
        previousValue: Math.random() * 1000000 + 100000,
        target: Math.random() * 1200000 + 150000,
        childCount: Math.floor(Math.random() * 10) + 1,
        metadata: {
          dataSource: 'mock',
          confidence: 0.95,
          lastUpdated: new Date()
        }
      });
    });
    
    return data.sort((a, b) => b.value - a.value).slice(0, query.limit || 50);
  }

  private getDimensionValues(dimension: string): string[] {
    const dimensionData: Record<string, string[]> = {
      region: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'],
      office: ['New York', 'London', 'Hong Kong', 'Tokyo', 'Frankfurt', 'Singapore', 'Sydney', 'Toronto'],
      advisor: ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Lisa Davis'],
      product: ['Equities', 'Fixed Income', 'Alternatives', 'Cash & Equivalents', 'Real Estate'],
      client_segment: ['High Net Worth', 'Ultra High Net Worth', 'Institutional', 'Retail', 'Family Office'],
      asset_class: ['Domestic Equity', 'International Equity', 'Government Bonds', 'Corporate Bonds', 'Commodities'],
      strategy: ['Growth', 'Value', 'Balanced', 'Income', 'Conservative', 'Aggressive']
    };
    
    return dimensionData[dimension] || ['Unknown'];
  }
}

class AggregationEngine {
  async calculate(data: DrillDownDataPoint[], level: DrillDownLevel): Promise<DrillDownAggregation[]> {
    const values = data.map(d => d.value);
    
    const aggregations: DrillDownAggregation[] = [
      {
        type: 'sum',
        value: values.reduce((sum, val) => sum + val, 0),
        formattedValue: '',
        label: 'Total'
      },
      {
        type: 'avg',
        value: values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
        formattedValue: '',
        label: 'Average'
      },
      {
        type: 'max',
        value: values.length > 0 ? Math.max(...values) : 0,
        formattedValue: '',
        label: 'Maximum'
      },
      {
        type: 'min',
        value: values.length > 0 ? Math.min(...values) : 0,
        formattedValue: '',
        label: 'Minimum'
      },
      {
        type: 'count',
        value: data.length,
        formattedValue: '',
        label: 'Count'
      }
    ];

    aggregations.forEach(agg => {
      agg.formattedValue = new Intl.NumberFormat('en-US', {
        style: agg.type === 'count' ? 'decimal' : 'currency',
        currency: 'USD'
      }).format(agg.value);
    });

    return aggregations;
  }
}

class InsightEngine {
  async generateRecommendations(data: DrillDownDataPoint[], level: DrillDownLevel): Promise<DrillDownRecommendation[]> {
    const recommendations: DrillDownRecommendation[] = [];

    const outliers = this.findOutliers(data);
    if (outliers.length > 0) {
      recommendations.push({
        type: 'outlier',
        title: 'Significant outliers detected',
        description: `${outliers.length} data points show unusual values that may require attention.`,
        dataPoints: outliers.map(o => o.label),
        priority: 'medium',
        actionable: true
      });
    }

    const strongTrends = data.filter(d => Math.abs(d.trend.percentage) > 20);
    if (strongTrends.length > 0) {
      const topTrend = strongTrends.sort((a, b) => Math.abs(b.trend.percentage) - Math.abs(a.trend.percentage))[0];
      recommendations.push({
        type: 'trend',
        title: `Strong ${topTrend.trend.direction} trend in ${topTrend.label}`,
        description: `${topTrend.label} shows ${Math.abs(topTrend.trend.percentage).toFixed(1)}% ${topTrend.trend.direction === 'up' ? 'growth' : 'decline'}.`,
        dataPoints: [topTrend.label],
        priority: 'high',
        actionable: true
      });
    }

    const opportunities = data.filter(d => d.trend.direction === 'up' && d.trend.percentage > 15);
    if (opportunities.length > 0) {
      recommendations.push({
        type: 'opportunity',
        title: 'Growth opportunities identified',
        description: `${opportunities.length} areas show strong growth potential.`,
        dataPoints: opportunities.map(o => o.label),
        priority: 'medium',
        actionable: true
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private findOutliers(data: DrillDownDataPoint[]): DrillDownDataPoint[] {
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    return data.filter(d => Math.abs(d.value - mean) > 2 * stdDev);
  }
}

interface ExportResult {
  id: string;
  format: string;
  filename: string;
  data: string;
  size: number;
  createdAt: Date;
  expiresAt: Date;
}

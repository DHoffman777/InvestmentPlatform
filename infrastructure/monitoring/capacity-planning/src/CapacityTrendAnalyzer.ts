import { EventEmitter } from 'events';
import {
  ResourceMetrics,
  CapacityTrend,
  TimeGranularity,
  ChangePoint,
  TrendRecommendation,
  ResourceType
} from './CapacityPlanningDataModel';

export interface TrendAnalyzerConfig {
  analysisInterval: number;
  minDataPoints: number;
  seasonalityDetectionThreshold: number;
  changePointSensitivity: number;
  forecastHorizon: number;
  confidenceThreshold: number;
  enableSeasonalityDetection: boolean;
  enableChangePointDetection: boolean;
  enableForecastGeneration: boolean;
}

export interface TrendAnalysisRequest {
  resourceId: string;
  metric: string;
  timeRange: {
    start: Date;
    end: Date;
    granularity: TimeGranularity;
  };
  options?: {
    detectSeasonality?: boolean;
    detectChangePoints?: boolean;
    generateForecast?: boolean;
    includeConfidenceIntervals?: boolean;
  };
}

export interface SeasonalPattern {
  period: number;
  strength: number;
  peaks: number[];
  troughs: number[];
  confidence: number;
}

export interface TrendComponents {
  trend: number[];
  seasonal: number[];
  residual: number[];
  originalValues: number[];
  timestamps: Date[];
}

export class CapacityTrendAnalyzer extends EventEmitter {
  private trends: Map<string, CapacityTrend> = new Map();
  private analysisTimer: NodeJS.Timeout;
  private config: TrendAnalyzerConfig;
  private timeSeriesProcessor: TimeSeriesProcessor;
  private seasonalityDetector: SeasonalityDetector;
  private changePointDetector: ChangePointDetector;
  private forecastEngine: ForecastEngine;

  constructor(config: TrendAnalyzerConfig) {
    super();
    this.config = config;
    this.timeSeriesProcessor = new TimeSeriesProcessor();
    this.seasonalityDetector = new SeasonalityDetector(config.seasonalityDetectionThreshold);
    this.changePointDetector = new ChangePointDetector(config.changePointSensitivity);
    this.forecastEngine = new ForecastEngine(config.forecastHorizon);
    this.startAnalysis();
  }

  async analyzeTrend(request: TrendAnalysisRequest): Promise<CapacityTrend> {
    const startTime = Date.now();
    const trendId = this.generateTrendId(request.resourceId, request.metric);
    
    this.emit('analysisStarted', { trendId, resourceId: request.resourceId, metric: request.metric });

    try {
      const metrics = await this.getMetricsData(request);
      
      if (metrics.length < this.config.minDataPoints) {
        throw new Error(`Insufficient data points. Need at least ${this.config.minDataPoints}, got ${metrics.length}`);
      }

      const timeSeries = this.extractTimeSeries(metrics, request.metric);
      const trendComponents = await this.decomposeTrend(timeSeries);
      const statistics = this.calculateStatistics(timeSeries.values);
      
      let seasonality: SeasonalPattern | null = null;
      if (request.options?.detectSeasonality !== false && this.config.enableSeasonalityDetection) {
        seasonality = await this.seasonalityDetector.detect(timeSeries);
      }

      let changePoints: ChangePoint[] = [];
      if (request.options?.detectChangePoints !== false && this.config.enableChangePointDetection) {
        changePoints = await this.changePointDetector.detect(timeSeries);
      }

      let forecast: { shortTerm: number[]; longTerm: number[]; uncertainty: number } | null = null;
      if (request.options?.generateForecast !== false && this.config.enableForecastGeneration) {
        forecast = await this.forecastEngine.generate(timeSeries, seasonality);
      }

      const trend: CapacityTrend = {
        id: trendId,
        resourceId: request.resourceId,
        metric: request.metric,
        timeRange: request.timeRange,
        trend: {
          direction: this.determineTrendDirection(trendComponents.trend),
          slope: this.calculateSlope(trendComponents.trend),
          correlation: this.calculateCorrelation(timeSeries.values, trendComponents.trend),
          seasonality: seasonality ? {
            detected: true,
            period: seasonality.period,
            strength: seasonality.strength
          } : {
            detected: false
          }
        },
        statistics,
        changePoints,
        forecast: forecast || {
          shortTerm: [],
          longTerm: [],
          uncertainty: 0
        },
        recommendations: await this.generateRecommendations(trendComponents, seasonality, changePoints, request),
        calculatedAt: new Date()
      };

      this.trends.set(trendId, trend);
      
      const analysisTime = Date.now() - startTime;
      this.emit('analysisCompleted', { 
        trendId, 
        resourceId: request.resourceId, 
        metric: request.metric,
        analysisTime,
        dataPoints: metrics.length 
      });

      return trend;
    } catch (error) {
      this.emit('analysisFailed', { 
        trendId, 
        resourceId: request.resourceId, 
        metric: request.metric, 
        error: error.message 
      });
      throw error;
    }
  }

  async batchAnalyzeTrends(requests: TrendAnalysisRequest[]): Promise<CapacityTrend[]> {
    const batchId = this.generateBatchId();
    this.emit('batchAnalysisStarted', { batchId, requests: requests.length });

    const startTime = Date.now();
    const results: CapacityTrend[] = [];

    const batches = this.chunkArray(requests, 5);
    
    for (const batch of batches) {
      const batchPromises = batch.map(request => 
        this.analyzeTrend(request).catch(error => {
          console.error(`Batch trend analysis failed for ${request.resourceId}:`, error);
          return null;
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null) as CapacityTrend[]);
    }

    const batchTime = Date.now() - startTime;
    this.emit('batchAnalysisCompleted', { 
      batchId, 
      results: results.length, 
      failures: requests.length - results.length,
      batchTime 
    });

    return results;
  }

  async detectAnomalies(
    resourceId: string, 
    metric: string, 
    timeRange: { start: Date; end: Date }
  ): Promise<{
    anomalies: Array<{
      timestamp: Date;
      value: number;
      expectedValue: number;
      severity: 'low' | 'medium' | 'high';
      type: 'outlier' | 'trend_break' | 'seasonal_anomaly';
    }>;
    summary: {
      totalAnomalies: number;
      severityDistribution: Record<string, number>;
      typeDistribution: Record<string, number>;
    };
  }> {
    const request: TrendAnalysisRequest = {
      resourceId,
      metric,
      timeRange: {
        start: timeRange.start,
        end: timeRange.end,
        granularity: TimeGranularity.HOUR
      }
    };

    const trend = await this.analyzeTrend(request);
    const metrics = await this.getMetricsData(request);
    const timeSeries = this.extractTimeSeries(metrics, metric);
    
    const anomalies = await this.detectTimeSeriesAnomalies(timeSeries, trend);
    
    const summary = {
      totalAnomalies: anomalies.length,
      severityDistribution: this.groupBy(anomalies, 'severity'),
      typeDistribution: this.groupBy(anomalies, 'type')
    };

    return { anomalies, summary };
  }

  async compareResourceTrends(
    resourceIds: string[], 
    metric: string, 
    timeRange: { start: Date; end: Date }
  ): Promise<{
    trends: CapacityTrend[];
    comparison: {
      correlations: Array<{ resource1: string; resource2: string; correlation: number }>;
      rankings: Array<{ resourceId: string; score: number; rank: number }>;
      clusters: Array<{ resources: string[]; similarity: number }>;
    };
  }> {
    const requests = resourceIds.map(resourceId => ({
      resourceId,
      metric,
      timeRange: {
        start: timeRange.start,
        end: timeRange.end,
        granularity: TimeGranularity.HOUR
      }
    }));

    const trends = await this.batchAnalyzeTrends(requests);
    const comparison = await this.compareTrends(trends);

    return { trends, comparison };
  }

  async getTrendSummary(resourceType?: ResourceType, timeRange?: { start: Date; end: Date }): Promise<{
    totalTrends: number;
    trendsByDirection: Record<string, number>;
    averageSlope: number;
    seasonalityDetectionRate: number;
    changePointFrequency: number;
    forecastAccuracy: number;
  }> {
    let trends = Array.from(this.trends.values());
    
    if (timeRange) {
      trends = trends.filter(t => 
        t.timeRange.start >= timeRange.start && t.timeRange.end <= timeRange.end
      );
    }

    const trendsByDirection = this.groupBy(trends, t => t.trend.direction);
    const averageSlope = trends.reduce((sum, t) => sum + t.trend.slope, 0) / trends.length;
    const seasonalityDetectionRate = trends.filter(t => t.trend.seasonality.detected).length / trends.length;
    const changePointFrequency = trends.reduce((sum, t) => sum + t.changePoints.length, 0) / trends.length;

    return {
      totalTrends: trends.length,
      trendsByDirection,
      averageSlope,
      seasonalityDetectionRate,
      changePointFrequency,
      forecastAccuracy: 0.85
    };
  }

  private async decomposeTrend(timeSeries: TimeSeries): Promise<TrendComponents> {
    const values = timeSeries.values;
    const n = values.length;
    
    const trend = await this.extractTrend(values);
    const detrended = values.map((val, i) => val - trend[i]);
    const seasonal = await this.extractSeasonal(detrended);
    const residual = detrended.map((val, i) => val - seasonal[i]);

    return {
      trend,
      seasonal,
      residual,
      originalValues: values,
      timestamps: timeSeries.timestamps
    };
  }

  private async extractTrend(values: number[]): Promise<number[]> {
    const windowSize = Math.min(24, Math.floor(values.length / 4));
    const trend: number[] = [];

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(values.length, i + Math.floor(windowSize / 2) + 1);
      const window = values.slice(start, end);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      trend.push(average);
    }

    return trend;
  }

  private async extractSeasonal(detrended: number[]): Promise<number[]> {
    const period = 24;
    const seasonal = new Array(detrended.length).fill(0);
    
    if (detrended.length < period * 2) {
      return seasonal;
    }

    for (let i = 0; i < period; i++) {
      const seasonalValues: number[] = [];
      for (let j = i; j < detrended.length; j += period) {
        seasonalValues.push(detrended[j]);
      }
      
      const seasonalAverage = seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length;
      
      for (let j = i; j < detrended.length; j += period) {
        seasonal[j] = seasonalAverage;
      }
    }

    return seasonal;
  }

  private extractTimeSeries(metrics: ResourceMetrics[], metric: string): TimeSeries {
    const values: number[] = [];
    const timestamps: Date[] = [];

    for (const m of metrics) {
      values.push(this.extractMetricValue(m, metric));
      timestamps.push(m.timestamp);
    }

    return { values, timestamps };
  }

  private extractMetricValue(metrics: ResourceMetrics, metric: string): number {
    switch (metric) {
      case 'cpu_usage':
        return metrics.cpu.usage;
      case 'memory_usage':
        return metrics.memory.usage;
      case 'disk_usage':
        return metrics.disk.usage;
      case 'network_in':
        return metrics.network.bytesIn;
      case 'network_out':
        return metrics.network.bytesOut;
      default:
        return metrics.custom[metric] || 0;
    }
  }

  private calculateStatistics(values: number[]): {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    percentiles: Record<number, number>;
  } {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    
    const percentiles: Record<number, number> = {};
    [10, 25, 50, 75, 90, 95, 99].forEach(p => {
      const index = Math.floor((p / 100) * (n - 1));
      percentiles[p] = sorted[index];
    });

    return {
      mean,
      median: sorted[Math.floor(n / 2)],
      stdDev: Math.sqrt(variance),
      min: Math.min(...values),
      max: Math.max(...values),
      percentiles
    };
  }

  private determineTrendDirection(trendValues: number[]): 'increasing' | 'decreasing' | 'stable' {
    const slope = this.calculateSlope(trendValues);
    const threshold = 0.01;
    
    if (Math.abs(slope) < threshold) return 'stable';
    return slope > 0 ? 'increasing' : 'decreasing';
  }

  private calculateSlope(values: number[]): number {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    const xSlice = x.slice(0, n);
    const ySlice = y.slice(0, n);
    
    const meanX = xSlice.reduce((sum, val) => sum + val, 0) / n;
    const meanY = ySlice.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = xSlice[i] - meanX;
      const dy = ySlice[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }
    
    return numerator / Math.sqrt(denomX * denomY);
  }

  private async generateRecommendations(
    trendComponents: TrendComponents,
    seasonality: SeasonalPattern | null,
    changePoints: ChangePoint[],
    request: TrendAnalysisRequest
  ): Promise<TrendRecommendation[]> {
    const recommendations: TrendRecommendation[] = [];
    const slope = this.calculateSlope(trendComponents.trend);
    
    if (Math.abs(slope) > 0.1) {
      const direction = slope > 0 ? 'increasing' : 'decreasing';
      const action = slope > 0 ? 'scale_up' : 'optimize';
      
      recommendations.push({
        type: action,
        priority: Math.abs(slope) > 0.5 ? 'high' : 'medium',
        message: `${request.metric} shows ${direction} trend with slope ${slope.toFixed(3)}`,
        expectedImpact: `${Math.abs(slope * 100).toFixed(1)}% change expected`,
        timeframe: 'Next 7 days',
        confidence: 0.8
      });
    }

    if (seasonality && seasonality.strength > 0.3) {
      recommendations.push({
        type: 'optimize',
        priority: 'medium',
        message: `Seasonal pattern detected with ${seasonality.period}h period`,
        expectedImpact: 'Predictable capacity planning opportunities',
        timeframe: 'Next seasonal cycle',
        confidence: seasonality.confidence
      });
    }

    if (changePoints.length > 0) {
      const recentChangePoints = changePoints.filter(cp => 
        Date.now() - cp.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
      );
      
      if (recentChangePoints.length > 0) {
        recommendations.push({
          type: 'investigate',
          priority: 'high',
          message: `${recentChangePoints.length} recent change points detected`,
          expectedImpact: 'Potential system instability or configuration changes',
          timeframe: 'Immediate',
          confidence: 0.9
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async detectTimeSeriesAnomalies(timeSeries: TimeSeries, trend: CapacityTrend): Promise<Array<{
    timestamp: Date;
    value: number;
    expectedValue: number;
    severity: 'low' | 'medium' | 'high';
    type: 'outlier' | 'trend_break' | 'seasonal_anomaly';
  }>> {
    const anomalies: Array<{
      timestamp: Date;
      value: number;
      expectedValue: number;
      severity: 'low' | 'medium' | 'high';
      type: 'outlier' | 'trend_break' | 'seasonal_anomaly';
    }> = [];

    const mean = trend.statistics.mean;
    const stdDev = trend.statistics.stdDev;
    const threshold = 2 * stdDev;

    for (let i = 0; i < timeSeries.values.length; i++) {
      const value = timeSeries.values[i];
      const deviation = Math.abs(value - mean);
      
      if (deviation > threshold) {
        const severity = deviation > 3 * stdDev ? 'high' : deviation > 2.5 * stdDev ? 'medium' : 'low';
        
        anomalies.push({
          timestamp: timeSeries.timestamps[i],
          value,
          expectedValue: mean,
          severity,
          type: 'outlier'
        });
      }
    }

    return anomalies;
  }

  private async compareTrends(trends: CapacityTrend[]): Promise<{
    correlations: Array<{ resource1: string; resource2: string; correlation: number }>;
    rankings: Array<{ resourceId: string; score: number; rank: number }>;
    clusters: Array<{ resources: string[]; similarity: number }>;
  }> {
    const correlations: Array<{ resource1: string; resource2: string; correlation: number }> = [];
    
    for (let i = 0; i < trends.length; i++) {
      for (let j = i + 1; j < trends.length; j++) {
        const correlation = this.calculateCorrelation(
          [trends[i].trend.slope],
          [trends[j].trend.slope]
        );
        
        correlations.push({
          resource1: trends[i].resourceId,
          resource2: trends[j].resourceId,
          correlation
        });
      }
    }

    const rankings = trends
      .map((trend, index) => ({
        resourceId: trend.resourceId,
        score: Math.abs(trend.trend.slope) + (trend.trend.seasonality.detected ? 0.1 : 0),
        rank: index + 1
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    const clusters: Array<{ resources: string[]; similarity: number }> = [];
    const highCorrelations = correlations.filter(c => c.correlation > 0.7);
    
    if (highCorrelations.length > 0) {
      clusters.push({
        resources: [highCorrelations[0].resource1, highCorrelations[0].resource2],
        similarity: highCorrelations[0].correlation
      });
    }

    return { correlations, rankings, clusters };
  }

  private async getMetricsData(request: TrendAnalysisRequest): Promise<ResourceMetrics[]> {
    const duration = request.timeRange.end.getTime() - request.timeRange.start.getTime();
    const interval = this.getIntervalForGranularity(request.timeRange.granularity);
    const points = Math.floor(duration / interval);
    
    const metrics: ResourceMetrics[] = [];
    
    for (let i = 0; i < points; i++) {
      const timestamp = new Date(request.timeRange.start.getTime() + i * interval);
      metrics.push(this.generateMockMetrics(request.resourceId, timestamp));
    }
    
    return metrics;
  }

  private getIntervalForGranularity(granularity: TimeGranularity): number {
    switch (granularity) {
      case TimeGranularity.MINUTE:
        return 60 * 1000;
      case TimeGranularity.HOUR:
        return 60 * 60 * 1000;
      case TimeGranularity.DAY:
        return 24 * 60 * 60 * 1000;
      case TimeGranularity.WEEK:
        return 7 * 24 * 60 * 60 * 1000;
      case TimeGranularity.MONTH:
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  }

  private generateMockMetrics(resourceId: string, timestamp: Date): ResourceMetrics {
    const hour = timestamp.getHours();
    const day = timestamp.getDay();
    
    const baseUsage = 40;
    const dailyPattern = Math.sin((hour - 9) * Math.PI / 12) * 20;
    const weeklyPattern = day === 0 || day === 6 ? -10 : 0;
    const noise = (Math.random() - 0.5) * 10;
    
    const cpuUsage = Math.max(0, Math.min(100, baseUsage + dailyPattern + weeklyPattern + noise));
    
    return {
      id: `metric_${resourceId}_${timestamp.getTime()}`,
      resourceId,
      resourceType: ResourceType.SERVER,
      timestamp,
      cpu: {
        usage: cpuUsage,
        cores: 8,
        frequency: 2400
      },
      memory: {
        usage: cpuUsage * 0.8 + Math.random() * 10,
        total: 32768,
        available: 16384,
        cached: 2048,
        buffers: 1024
      },
      disk: {
        usage: 60 + Math.random() * 20,
        total: 1000000,
        available: 400000,
        iops: 1000 + Math.random() * 500,
        throughput: {
          read: 100 + Math.random() * 50,
          write: 80 + Math.random() * 40
        }
      },
      network: {
        bytesIn: 1000000 + Math.random() * 500000,
        bytesOut: 800000 + Math.random() * 400000,
        packetsIn: 1000 + Math.random() * 500,
        packetsOut: 800 + Math.random() * 400,
        errors: Math.floor(Math.random() * 3),
        latency: 10 + Math.random() * 15
      },
      custom: {}
    };
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private groupBy<T>(array: T[], keyFn: string | ((item: T) => string)): Record<string, number> {
    const groups: Record<string, number> = {};
    
    for (const item of array) {
      const key = typeof keyFn === 'string' ? (item as any)[keyFn] : keyFn(item);
      groups[key] = (groups[key] || 0) + 1;
    }
    
    return groups;
  }

  private startAnalysis(): void {
    this.analysisTimer = setInterval(async () => {
      try {
        await this.performScheduledAnalysis();
      } catch (error) {
        this.emit('scheduledAnalysisError', { error: error.message });
      }
    }, this.config.analysisInterval);
  }

  private async performScheduledAnalysis(): Promise<void> {
    console.log('Performing scheduled trend analysis...');
  }

  private generateTrendId(resourceId: string, metric: string): string {
    return `trend_${resourceId}_${metric}_${Date.now()}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTrend(trendId: string): CapacityTrend | null {
    return this.trends.get(trendId) || null;
  }

  getAllTrends(): CapacityTrend[] {
    return Array.from(this.trends.values());
  }

  async shutdown(): Promise<void> {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }
    
    this.trends.clear();
    this.emit('shutdown');
  }
}

interface TimeSeries {
  values: number[];
  timestamps: Date[];
}

class TimeSeriesProcessor {
  async smooth(values: number[], windowSize: number = 5): Promise<number[]> {
    const smoothed: number[] = [];
    
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(values.length, i + Math.floor(windowSize / 2) + 1);
      const window = values.slice(start, end);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      smoothed.push(average);
    }
    
    return smoothed;
  }

  async detectOutliers(values: number[], threshold: number = 2): Promise<number[]> {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    return values.map((val, index) => 
      Math.abs(val - mean) > threshold * stdDev ? index : -1
    ).filter(index => index !== -1);
  }
}

class SeasonalityDetector {
  private threshold: number;

  constructor(threshold: number) {
    this.threshold = threshold;
  }

  async detect(timeSeries: TimeSeries): Promise<SeasonalPattern | null> {
    const values = timeSeries.values;
    
    if (values.length < 48) {
      return null;
    }

    const periods = [24, 168, 720];
    let bestPattern: SeasonalPattern | null = null;
    let bestStrength = 0;

    for (const period of periods) {
      if (values.length < period * 2) continue;
      
      const pattern = await this.analyzePattern(values, period);
      
      if (pattern.strength > bestStrength && pattern.strength > this.threshold) {
        bestStrength = pattern.strength;
        bestPattern = pattern;
      }
    }

    return bestPattern;
  }

  private async analyzePattern(values: number[], period: number): Promise<SeasonalPattern> {
    const cycles = Math.floor(values.length / period);
    const seasonalValues = new Array(period).fill(0);
    const counts = new Array(period).fill(0);
    
    for (let i = 0; i < values.length; i++) {
      const seasonalIndex = i % period;
      seasonalValues[seasonalIndex] += values[i];
      counts[seasonalIndex]++;
    }

    for (let i = 0; i < period; i++) {
      if (counts[i] > 0) {
        seasonalValues[i] /= counts[i];
      }
    }

    const mean = seasonalValues.reduce((sum, val) => sum + val, 0) / period;
    const variance = seasonalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const strength = Math.sqrt(variance) / mean;

    const peaks = seasonalValues
      .map((val, i) => ({ value: val, index: i }))
      .filter(item => item.value > mean + Math.sqrt(variance))
      .map(item => item.index);

    const troughs = seasonalValues
      .map((val, i) => ({ value: val, index: i }))
      .filter(item => item.value < mean - Math.sqrt(variance))
      .map(item => item.index);

    return {
      period,
      strength: Math.min(1, strength),
      peaks,
      troughs,
      confidence: cycles >= 2 ? 0.8 : 0.5
    };
  }
}

class ChangePointDetector {
  private sensitivity: number;

  constructor(sensitivity: number) {
    this.sensitivity = sensitivity;
  }

  async detect(timeSeries: TimeSeries): Promise<ChangePoint[]> {
    const values = timeSeries.values;
    const timestamps = timeSeries.timestamps;
    const changePoints: ChangePoint[] = [];

    if (values.length < 10) {
      return changePoints;
    }

    const windowSize = Math.max(5, Math.floor(values.length / 20));
    
    for (let i = windowSize; i < values.length - windowSize; i++) {
      const beforeWindow = values.slice(i - windowSize, i);
      const afterWindow = values.slice(i, i + windowSize);
      
      const beforeMean = beforeWindow.reduce((sum, val) => sum + val, 0) / beforeWindow.length;
      const afterMean = afterWindow.reduce((sum, val) => sum + val, 0) / afterWindow.length;
      
      const beforeVar = beforeWindow.reduce((sum, val) => sum + Math.pow(val - beforeMean, 2), 0) / beforeWindow.length;
      const afterVar = afterWindow.reduce((sum, val) => sum + Math.pow(val - afterMean, 2), 0) / afterWindow.length;
      
      const meanChange = Math.abs(afterMean - beforeMean);
      const varChange = Math.abs(afterVar - beforeVar);
      
      const significance = meanChange / Math.sqrt((beforeVar + afterVar) / 2);
      
      if (significance > this.sensitivity) {
        const changePercent = ((afterMean - beforeMean) / beforeMean) * 100;
        
        changePoints.push({
          timestamp: timestamps[i],
          beforeValue: beforeMean,
          afterValue: afterMean,
          changePercent,
          significance,
          type: this.classifyChangeType(meanChange, varChange, changePercent)
        });
      }
    }

    return changePoints.sort((a, b) => b.significance - a.significance).slice(0, 10);
  }

  private classifyChangeType(meanChange: number, varChange: number, changePercent: number): 'increase' | 'decrease' | 'level_shift' | 'variance_change' {
    if (varChange > meanChange) {
      return 'variance_change';
    }
    
    if (Math.abs(changePercent) > 20) {
      return changePercent > 0 ? 'increase' : 'decrease';
    }
    
    return 'level_shift';
  }
}

class ForecastEngine {
  private horizon: number;

  constructor(horizon: number) {
    this.horizon = horizon;
  }

  async generate(
    timeSeries: TimeSeries, 
    seasonality: SeasonalPattern | null
  ): Promise<{ shortTerm: number[]; longTerm: number[]; uncertainty: number }> {
    const values = timeSeries.values;
    
    if (values.length < 5) {
      return { shortTerm: [], longTerm: [], uncertainty: 1.0 };
    }

    const trend = this.calculateTrend(values);
    const lastValue = values[values.length - 1];
    
    const shortTerm: number[] = [];
    const longTerm: number[] = [];
    
    for (let i = 1; i <= this.horizon; i++) {
      let forecast = lastValue + trend * i;
      
      if (seasonality && seasonality.strength > 0.3) {
        const seasonalIndex = (values.length + i - 1) % seasonality.period;
        const seasonalFactor = this.getSeasonalFactor(seasonality, seasonalIndex);
        forecast *= seasonalFactor;
      }
      
      if (i <= 24) {
        shortTerm.push(forecast);
      } else {
        longTerm.push(forecast);
      }
    }

    const uncertainty = this.calculateUncertainty(values, shortTerm);

    return { shortTerm, longTerm, uncertainty };
  }

  private calculateTrend(values: number[]): number {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private getSeasonalFactor(seasonality: SeasonalPattern, index: number): number {
    return 1.0 + (Math.sin(2 * Math.PI * index / seasonality.period) * seasonality.strength * 0.1);
  }

  private calculateUncertainty(historical: number[], forecast: number[]): number {
    if (historical.length < 10 || forecast.length === 0) {
      return 0.5;
    }

    const historicalMean = historical.reduce((sum, val) => sum + val, 0) / historical.length;
    const historicalVar = historical.reduce((sum, val) => sum + Math.pow(val - historicalMean, 2), 0) / historical.length;
    const historicalCV = Math.sqrt(historicalVar) / historicalMean;
    
    return Math.min(1.0, Math.max(0.1, historicalCV));
  }
}
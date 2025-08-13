import { EventEmitter } from 'events';
import {
  ResourceMetrics,
  PredictionModel,
  CapacityPrediction,
  ModelType,
  PredictionAlgorithm,
  ModelParameters,
  PredictionPoint,
  ResourceType,
  TimeGranularity
} from './CapacityPlanningDataModel';

export interface PredictionServiceConfig {
  dataRetentionDays: number;
  defaultLookbackPeriod: number;
  defaultPredictionHorizon: number;
  modelRetrainingInterval: number;
  minDataPointsForPrediction: number;
  enableAutoModelSelection: boolean;
  modelAccuracyThreshold: number;
  parallelPredictions: number;
}

export class ResourceUsagePredictionService extends EventEmitter {
  private models: Map<string, PredictionModel> = new Map();
  private predictions: Map<string, CapacityPrediction> = new Map();
  private trainingData: Map<string, ResourceMetrics[]> = new Map();
  private modelPerformance: Map<string, number[]> = new Map();
  private retrainingTimer: NodeJS.Timeout;
  private config: PredictionServiceConfig;

  constructor(config: PredictionServiceConfig) {
    super();
    this.config = config;
    this.initializeDefaultModels();
    this.startModelRetraining();
  }

  async createPredictionModel(modelConfig: Partial<PredictionModel>): Promise<PredictionModel> {
    const model: PredictionModel = {
      id: modelConfig.id || this.generateModelId(),
      name: modelConfig.name || 'Unnamed Model',
      type: modelConfig.type || ModelType.TIME_SERIES,
      resourceType: modelConfig.resourceType!,
      metric: modelConfig.metric!,
      algorithm: modelConfig.algorithm || PredictionAlgorithm.LINEAR_REGRESSION,
      parameters: modelConfig.parameters || this.getDefaultParameters(),
      accuracy: 0,
      lastTrained: new Date(),
      isActive: modelConfig.isActive !== false,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.validateModel(model);
    this.models.set(model.id, model);
    
    this.emit('modelCreated', { modelId: model.id, resourceType: model.resourceType });
    return model;
  }

  async trainModel(modelId: string, trainingData: ResourceMetrics[]): Promise<number> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (trainingData.length < this.config.minDataPointsForPrediction) {
      throw new Error(`Insufficient training data. Need at least ${this.config.minDataPointsForPrediction} data points`);
    }

    const startTime = Date.now();
    this.emit('trainingStarted', { modelId, dataPoints: trainingData.length });

    try {
      const processedData = await this.preprocessData(trainingData, model);
      const accuracy = await this.executeTraining(model, processedData);
      
      model.accuracy = accuracy;
      model.lastTrained = new Date();
      model.nextTraining = new Date(Date.now() + this.config.modelRetrainingInterval);
      model.updatedAt = new Date();

      this.models.set(modelId, model);
      
      if (!this.modelPerformance.has(modelId)) {
        this.modelPerformance.set(modelId, []);
      }
      this.modelPerformance.get(modelId)!.push(accuracy);

      const trainingTime = Date.now() - startTime;
      this.emit('trainingCompleted', { 
        modelId, 
        accuracy, 
        trainingTime,
        dataPoints: trainingData.length 
      });

      return accuracy;
    } catch (error) {
      this.emit('trainingFailed', { modelId, error: error.message });
      throw error;
    }
  }

  async generatePrediction(
    modelId: string, 
    resourceId: string, 
    options: {
      horizon?: number;
      confidence?: number;
      includeUncertainty?: boolean;
    } = {}
  ): Promise<CapacityPrediction> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (!model.isActive) {
      throw new Error(`Model ${modelId} is not active`);
    }

    if (model.accuracy < this.config.modelAccuracyThreshold) {
      console.warn(`Model ${modelId} accuracy (${model.accuracy}) below threshold (${this.config.modelAccuracyThreshold})`);
    }

    const predictionId = this.generatePredictionId();
    const horizon = options.horizon || model.parameters.predictionHorizon;
    const confidence = options.confidence || 0.95;

    const startTime = Date.now();
    this.emit('predictionStarted', { predictionId, modelId, resourceId, horizon });

    try {
      const historicalData = await this.getHistoricalData(resourceId, model.metric, model.parameters.lookbackPeriod);
      const processedData = await this.preprocessData(historicalData, model);
      
      const predictions = await this.executePrediction(model, processedData, horizon);
      const confidenceIntervals = await this.calculateConfidenceIntervals(predictions, confidence);
      
      const prediction: CapacityPrediction = {
        id: predictionId,
        modelId,
        resourceId,
        metric: model.metric,
        predictions,
        confidence: {
          lower: confidenceIntervals.lower,
          upper: confidenceIntervals.upper,
          interval: confidence
        },
        metadata: {
          generatedAt: new Date(),
          dataRange: {
            start: historicalData[0]?.timestamp || new Date(),
            end: historicalData[historicalData.length - 1]?.timestamp || new Date()
          },
          modelAccuracy: model.accuracy,
          warnings: this.validatePredictionQuality(predictions)
        }
      };

      this.predictions.set(predictionId, prediction);
      
      const predictionTime = Date.now() - startTime;
      this.emit('predictionCompleted', { 
        predictionId, 
        modelId, 
        resourceId, 
        predictionTime,
        dataPoints: predictions.length 
      });

      return prediction;
    } catch (error) {
      this.emit('predictionFailed', { predictionId, modelId, resourceId, error: error.message });
      throw error;
    }
  }

  async batchPredict(requests: Array<{
    modelId: string;
    resourceId: string;
    options?: any;
  }>): Promise<CapacityPrediction[]> {
    const batchId = this.generateBatchId();
    this.emit('batchPredictionStarted', { batchId, requests: requests.length });

    const startTime = Date.now();
    const results: CapacityPrediction[] = [];

    const batches = this.chunkArray(requests, this.config.parallelPredictions);
    
    for (const batch of batches) {
      const batchPromises = batch.map(request => 
        this.generatePrediction(request.modelId, request.resourceId, request.options)
          .catch(error => {
            console.error(`Batch prediction failed for ${request.resourceId}:`, error);
            return null;
          })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null) as CapacityPrediction[]);
    }

    const batchTime = Date.now() - startTime;
    this.emit('batchPredictionCompleted', { 
      batchId, 
      results: results.length, 
      failures: requests.length - results.length,
      batchTime 
    });

    return results;
  }

  async evaluateModelPerformance(modelId: string): Promise<{
    accuracy: number;
    mae: number;
    rmse: number;
    mape: number;
    r2: number;
    trend: 'improving' | 'declining' | 'stable';
    recommendations: string[];
  }> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const performance = this.modelPerformance.get(modelId) || [];
    if (performance.length === 0) {
      throw new Error(`No performance data available for model ${modelId}`);
    }

    const testData = await this.getTestData(model);
    const predictions = await this.executePrediction(model, testData, testData.length);
    
    const metrics = this.calculatePerformanceMetrics(testData, predictions);
    const trend = this.analyzeTrend(performance);
    const recommendations = this.generateModelRecommendations(model, metrics, trend);

    return {
      accuracy: model.accuracy,
      mae: metrics.mae,
      rmse: metrics.rmse,
      mape: metrics.mape,
      r2: metrics.r2,
      trend,
      recommendations
    };
  }

  async optimizeModel(modelId: string): Promise<PredictionModel> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    this.emit('modelOptimizationStarted', { modelId });

    const originalAccuracy = model.accuracy;
    const optimizationResults: Array<{ parameters: ModelParameters; accuracy: number }> = [];

    const parameterSets = this.generateParameterCombinations(model);
    
    for (const parameters of parameterSets) {
      const testModel = { ...model, parameters };
      const trainingData = await this.getTrainingData(model);
      
      try {
        const accuracy = await this.executeTraining(testModel, trainingData);
        optimizationResults.push({ parameters, accuracy });
      } catch (error) {
        console.warn(`Parameter optimization failed for model ${modelId}:`, error);
      }
    }

    const bestResult = optimizationResults.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best
    );

    if (bestResult.accuracy > originalAccuracy) {
      model.parameters = bestResult.parameters;
      model.accuracy = bestResult.accuracy;
      model.version = this.incrementVersion(model.version);
      model.updatedAt = new Date();
      
      this.models.set(modelId, model);
      
      this.emit('modelOptimizationCompleted', { 
        modelId, 
        originalAccuracy, 
        newAccuracy: bestResult.accuracy,
        improvement: bestResult.accuracy - originalAccuracy
      });
    } else {
      this.emit('modelOptimizationCompleted', { 
        modelId, 
        originalAccuracy, 
        newAccuracy: originalAccuracy,
        improvement: 0
      });
    }

    return model;
  }

  async getModelsByResourceType(resourceType: ResourceType): Promise<PredictionModel[]> {
    return Array.from(this.models.values()).filter(model => 
      model.resourceType === resourceType && model.isActive
    );
  }

  async getBestModelForResource(resourceId: string, metric: string): Promise<PredictionModel | null> {
    const resourceType = await this.getResourceType(resourceId);
    const candidates = await this.getModelsByResourceType(resourceType);
    
    const metricModels = candidates.filter(model => model.metric === metric);
    if (metricModels.length === 0) {
      return null;
    }

    return metricModels.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best
    );
  }

  private async preprocessData(data: ResourceMetrics[], model: PredictionModel): Promise<number[]> {
    const values = data.map(d => this.extractMetricValue(d, model.metric));
    
    if (model.parameters.featureEngineering.differencing > 0) {
      return this.applyDifferencing(values, model.parameters.featureEngineering.differencing);
    }

    if (model.parameters.featureEngineering.scaling !== 'none') {
      return this.applyScaling(values, model.parameters.featureEngineering.scaling);
    }

    return values;
  }

  private async executeTraining(model: PredictionModel, data: number[]): Promise<number> {
    switch (model.algorithm) {
      case PredictionAlgorithm.LINEAR_REGRESSION:
        return this.trainLinearRegression(data, model.parameters);
      case PredictionAlgorithm.ARIMA:
        return this.trainARIMA(data, model.parameters);
      case PredictionAlgorithm.EXPONENTIAL_SMOOTHING:
        return this.trainExponentialSmoothing(data, model.parameters);
      case PredictionAlgorithm.PROPHET:
        return this.trainProphet(data, model.parameters);
      default:
        return this.trainLinearRegression(data, model.parameters);
    }
  }

  private async executePrediction(model: PredictionModel, data: number[], horizon: number): Promise<PredictionPoint[]> {
    const baseTimestamp = new Date();
    const predictions: PredictionPoint[] = [];

    switch (model.algorithm) {
      case PredictionAlgorithm.LINEAR_REGRESSION:
        const linearPredictions = this.predictLinearRegression(data, horizon, model.parameters);
        return linearPredictions.map((value, index) => ({
          timestamp: new Date(baseTimestamp.getTime() + index * 60 * 60 * 1000),
          value,
          confidence: this.calculatePointConfidence(value, data),
          trend: this.determineTrend(value, index > 0 ? linearPredictions[index - 1] : data[data.length - 1]),
          anomaly: this.detectAnomaly(value, data)
        }));

      case PredictionAlgorithm.ARIMA:
        const arimaPredictions = this.predictARIMA(data, horizon, model.parameters);
        return arimaPredictions.map((value, index) => ({
          timestamp: new Date(baseTimestamp.getTime() + index * 60 * 60 * 1000),
          value,
          confidence: this.calculatePointConfidence(value, data),
          trend: this.determineTrend(value, index > 0 ? arimaPredictions[index - 1] : data[data.length - 1]),
          anomaly: this.detectAnomaly(value, data)
        }));

      default:
        const defaultPredictions = this.predictLinearRegression(data, horizon, model.parameters);
        return defaultPredictions.map((value, index) => ({
          timestamp: new Date(baseTimestamp.getTime() + index * 60 * 60 * 1000),
          value,
          confidence: this.calculatePointConfidence(value, data),
          trend: this.determineTrend(value, index > 0 ? defaultPredictions[index - 1] : data[data.length - 1]),
          anomaly: this.detectAnomaly(value, data)
        }));
    }
  }

  private trainLinearRegression(data: number[], parameters: ModelParameters): number {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * data[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const predictions = x.map(xi => slope * xi + intercept);
    const mse = data.reduce((sum, actual, i) => sum + Math.pow(actual - predictions[i], 2), 0) / n;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - sumY / n, 2), 0) / n;
    
    return Math.max(0, 1 - mse / variance);
  }

  private predictLinearRegression(data: number[], horizon: number, parameters: ModelParameters): number[] {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * data[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return Array.from({ length: horizon }, (_, i) => slope * (n + i) + intercept);
  }

  private trainARIMA(data: number[], parameters: ModelParameters): number {
    const n = data.length;
    if (n < 10) return 0.5;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    
    const autocorr = this.calculateAutocorrelation(data, 1);
    return Math.max(0.1, Math.min(0.95, 0.7 + autocorr * 0.2));
  }

  private predictARIMA(data: number[], horizon: number, parameters: ModelParameters): number[] {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const lastValue = data[data.length - 1];
    const trend = (lastValue - data[0]) / data.length;
    
    return Array.from({ length: horizon }, (_, i) => lastValue + trend * (i + 1));
  }

  private trainExponentialSmoothing(data: number[], parameters: ModelParameters): number {
    const alpha = 0.3;
    let smoothed = data[0];
    
    for (let i = 1; i < data.length; i++) {
      smoothed = alpha * data[i] + (1 - alpha) * smoothed;
    }
    
    const mse = data.reduce((sum, actual, i) => {
      if (i === 0) return sum;
      const predicted = alpha * data[i - 1] + (1 - alpha) * smoothed;
      return sum + Math.pow(actual - predicted, 2);
    }, 0) / (data.length - 1);
    
    const variance = data.reduce((sum, val) => sum + Math.pow(val - data.reduce((s, v) => s + v, 0) / data.length, 2), 0) / data.length;
    
    return Math.max(0, 1 - mse / variance);
  }

  private trainProphet(data: number[], parameters: ModelParameters): number {
    return 0.8 + Math.random() * 0.15;
  }

  private calculateAutocorrelation(data: number[], lag: number): number {
    const n = data.length;
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n - lag; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean);
      denominator += Math.pow(data[i] - mean, 2);
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  private calculateConfidenceIntervals(predictions: PredictionPoint[], confidence: number): {
    lower: number[];
    upper: number[];
  } {
    const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.58 : 1.645;
    const values = predictions.map(p => p.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    return {
      lower: predictions.map(p => p.value - z * stdDev),
      upper: predictions.map(p => p.value + z * stdDev)
    };
  }

  private calculatePointConfidence(value: number, historicalData: number[]): number {
    const mean = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
    const stdDev = Math.sqrt(historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length);
    
    const zScore = Math.abs(value - mean) / stdDev;
    return Math.max(0.1, Math.min(1.0, 1 - zScore / 3));
  }

  private determineTrend(current: number, previous: number): 'increasing' | 'decreasing' | 'stable' {
    const threshold = Math.abs(previous) * 0.01;
    if (Math.abs(current - previous) < threshold) return 'stable';
    return current > previous ? 'increasing' : 'decreasing';
  }

  private detectAnomaly(value: number, historicalData: number[]): boolean {
    const mean = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
    const stdDev = Math.sqrt(historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length);
    
    return Math.abs(value - mean) > 2 * stdDev;
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

  private applyDifferencing(data: number[], order: number): number[] {
    let result = [...data];
    
    for (let d = 0; d < order; d++) {
      const diff = result.slice(1).map((val, i) => val - result[i]);
      result = diff;
    }
    
    return result;
  }

  private applyScaling(data: number[], method: string): number[] {
    switch (method) {
      case 'standard':
        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        const stdDev = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length);
        return data.map(val => (val - mean) / stdDev);
        
      case 'minmax':
        const min = Math.min(...data);
        const max = Math.max(...data);
        return data.map(val => (val - min) / (max - min));
        
      default:
        return data;
    }
  }

  private validatePredictionQuality(predictions: PredictionPoint[]): string[] {
    const warnings: string[] = [];
    
    if (predictions.some(p => p.confidence < 0.5)) {
      warnings.push('Some predictions have low confidence');
    }
    
    if (predictions.some(p => p.anomaly)) {
      warnings.push('Anomalies detected in predictions');
    }
    
    const trends = predictions.map(p => p.trend);
    const uniqueTrends = new Set(trends);
    if (uniqueTrends.size === 1 && trends[0] === 'stable') {
      warnings.push('All predictions show stable trend - may indicate model limitations');
    }
    
    return warnings;
  }

  private calculatePerformanceMetrics(actual: number[], predicted: PredictionPoint[]): {
    mae: number;
    rmse: number;
    mape: number;
    r2: number;
  } {
    const n = Math.min(actual.length, predicted.length);
    const actualSlice = actual.slice(0, n);
    const predictedSlice = predicted.slice(0, n).map(p => p.value);
    
    const mae = actualSlice.reduce((sum, act, i) => sum + Math.abs(act - predictedSlice[i]), 0) / n;
    const rmse = Math.sqrt(actualSlice.reduce((sum, act, i) => sum + Math.pow(act - predictedSlice[i], 2), 0) / n);
    
    const mape = actualSlice.reduce((sum, act, i) => {
      return sum + (act !== 0 ? Math.abs((act - predictedSlice[i]) / act) : 0);
    }, 0) / n * 100;
    
    const actualMean = actualSlice.reduce((sum, val) => sum + val, 0) / n;
    const ssRes = actualSlice.reduce((sum, act, i) => sum + Math.pow(act - predictedSlice[i], 2), 0);
    const ssTot = actualSlice.reduce((sum, act) => sum + Math.pow(act - actualMean, 2), 0);
    const r2 = 1 - ssRes / ssTot;
    
    return { mae, rmse, mape, r2 };
  }

  private analyzeTrend(performance: number[]): 'improving' | 'declining' | 'stable' {
    if (performance.length < 2) return 'stable';
    
    const recent = performance.slice(-Math.min(5, performance.length));
    const slope = this.calculateSlope(recent);
    
    if (Math.abs(slope) < 0.01) return 'stable';
    return slope > 0 ? 'improving' : 'declining';
  }

  private calculateSlope(data: number[]): number {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * data[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private generateModelRecommendations(model: PredictionModel, metrics: any, trend: string): string[] {
    const recommendations: string[] = [];
    
    if (model.accuracy < 0.7) {
      recommendations.push('Consider retraining the model with more data or different parameters');
    }
    
    if (trend === 'declining') {
      recommendations.push('Model performance is declining - consider model optimization or replacement');
    }
    
    if (metrics.mape > 20) {
      recommendations.push('High prediction error - review feature engineering or try different algorithm');
    }
    
    if (metrics.r2 < 0.5) {
      recommendations.push('Low correlation between predictions and actual values - model may not be suitable for this data');
    }
    
    return recommendations;
  }

  private generateParameterCombinations(model: PredictionModel): ModelParameters[] {
    const combinations: ModelParameters[] = [];
    const baseParms = model.parameters;
    
    const lookbackOptions = [baseParms.lookbackPeriod * 0.5, baseParms.lookbackPeriod, baseParms.lookbackPeriod * 1.5];
    const horizonOptions = [baseParms.predictionHorizon * 0.5, baseParms.predictionHorizon, baseParms.predictionHorizon * 1.5];
    
    for (const lookback of lookbackOptions) {
      for (const horizon of horizonOptions) {
        combinations.push({
          ...baseParms,
          lookbackPeriod: Math.floor(lookback),
          predictionHorizon: Math.floor(horizon)
        });
      }
    }
    
    return combinations.slice(0, 10);
  }

  private async getHistoricalData(resourceId: string, metric: string, lookbackPeriod: number): Promise<ResourceMetrics[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - lookbackPeriod * 60 * 60 * 1000);
    
    return this.generateMockData(resourceId, metric, startTime, endTime);
  }

  private async getTrainingData(model: PredictionModel): Promise<number[]> {
    const data = await this.getHistoricalData('mock', model.metric, model.parameters.lookbackPeriod);
    return data.map(d => this.extractMetricValue(d, model.metric));
  }

  private async getTestData(model: PredictionModel): Promise<number[]> {
    const data = await this.getHistoricalData('mock', model.metric, 100);
    return data.map(d => this.extractMetricValue(d, model.metric)).slice(-20);
  }

  private async getResourceType(resourceId: string): Promise<ResourceType> {
    return ResourceType.SERVER;
  }

  private generateMockData(resourceId: string, metric: string, start: Date, end: Date): ResourceMetrics[] {
    const data: ResourceMetrics[] = [];
    const duration = end.getTime() - start.getTime();
    const points = Math.floor(duration / (60 * 60 * 1000));
    
    for (let i = 0; i < points; i++) {
      const timestamp = new Date(start.getTime() + i * 60 * 60 * 1000);
      data.push({
        id: `metric_${i}`,
        resourceId,
        resourceType: ResourceType.SERVER,
        timestamp,
        cpu: {
          usage: 30 + Math.sin(i * 0.1) * 20 + Math.random() * 10,
          cores: 8,
          frequency: 2400
        },
        memory: {
          usage: 50 + Math.sin(i * 0.15) * 25 + Math.random() * 15,
          total: 32768,
          available: 16384,
          cached: 2048,
          buffers: 1024
        },
        disk: {
          usage: 60 + Math.sin(i * 0.05) * 15 + Math.random() * 5,
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
          errors: Math.floor(Math.random() * 5),
          latency: 10 + Math.random() * 20
        },
        custom: {}
      });
    }
    
    return data;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private initializeDefaultModels(): void {
    const defaultModels = [
      {
        resourceType: ResourceType.SERVER,
        metric: 'cpu_usage',
        algorithm: PredictionAlgorithm.LINEAR_REGRESSION
      },
      {
        resourceType: ResourceType.SERVER,
        metric: 'memory_usage',
        algorithm: PredictionAlgorithm.EXPONENTIAL_SMOOTHING
      },
      {
        resourceType: ResourceType.DATABASE,
        metric: 'cpu_usage',
        algorithm: PredictionAlgorithm.ARIMA
      }
    ];

    defaultModels.forEach((config, index) => {
      this.createPredictionModel({
        name: `Default ${config.resourceType} ${config.metric} Model`,
        resourceType: config.resourceType,
        metric: config.metric,
        algorithm: config.algorithm
      });
    });
  }

  private startModelRetraining(): void {
    this.retrainingTimer = setInterval(async () => {
      const modelsToRetrain = Array.from(this.models.values()).filter(model => 
        model.isActive && 
        model.nextTraining && 
        model.nextTraining <= new Date()
      );

      for (const model of modelsToRetrain) {
        try {
          const trainingData = await this.getTrainingData(model);
          await this.trainModel(model.id, []);
        } catch (error) {
          console.error(`Failed to retrain model ${model.id}:`, error);
        }
      }
    }, this.config.modelRetrainingInterval);
  }

  private getDefaultParameters(): ModelParameters {
    return {
      lookbackPeriod: 168,
      predictionHorizon: 24,
      seasonality: {
        enabled: true,
        period: 24,
        strength: 0.5
      },
      trend: {
        enabled: true,
        damped: false
      },
      hyperparameters: {},
      featureEngineering: {
        lagFeatures: [1, 2, 24],
        rollingWindows: [6, 12, 24],
        differencing: 0,
        scaling: 'standard'
      }
    };
  }

  private async validateModel(model: PredictionModel): Promise<void> {
    if (!model.name || model.name.trim().length === 0) {
      throw new Error('Model name is required');
    }
    
    if (!model.resourceType) {
      throw new Error('Resource type is required');
    }
    
    if (!model.metric) {
      throw new Error('Metric is required');
    }
    
    if (model.parameters.lookbackPeriod < 1) {
      throw new Error('Lookback period must be at least 1');
    }
    
    if (model.parameters.predictionHorizon < 1) {
      throw new Error('Prediction horizon must be at least 1');
    }
  }

  private generateModelId(): string {
    return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePredictionId(): string {
    return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  getModel(modelId: string): PredictionModel | null {
    return this.models.get(modelId) || null;
  }

  getAllModels(): PredictionModel[] {
    return Array.from(this.models.values());
  }

  getPrediction(predictionId: string): CapacityPrediction | null {
    return this.predictions.get(predictionId) || null;
  }

  getModelPerformance(modelId: string): number[] {
    return this.modelPerformance.get(modelId) || [];
  }

  async deactivateModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (model) {
      model.isActive = false;
      model.updatedAt = new Date();
      this.models.set(modelId, model);
      this.emit('modelDeactivated', { modelId });
    }
  }

  async shutdown(): Promise<void> {
    if (this.retrainingTimer) {
      clearInterval(this.retrainingTimer);
    }
    
    this.models.clear();
    this.predictions.clear();
    this.trainingData.clear();
    this.modelPerformance.clear();
    
    this.emit('shutdown');
  }
}
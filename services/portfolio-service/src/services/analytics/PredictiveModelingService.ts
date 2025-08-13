import { randomUUID } from 'crypto';
import {
  PredictiveModel,
  PredictiveInsight,
  AnalyticsMetricType,
  AnalyticsDataPoint,
  AnalyticsConfiguration
} from '../../models/analytics/Analytics';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';

interface ModelTrainingRequest {
  tenantId: string;
  modelType: PredictiveModel['modelType'];
  targetVariable: string;
  features: string[];
  trainingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  hyperparameters?: Record<string, any>;
  validationSplit?: number;
}

interface PredictionRequest {
  modelId: string;
  entityId: string; 
  entityType: 'portfolio' | 'position' | 'client';
  predictionType: PredictiveInsight['predictionType'];
  horizon: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
  features: Record<string, number>;
}

interface ModelPerformanceMetrics {
  modelId: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  mse?: number;
  mae?: number;
  r2?: number;
  backtestResults?: {
    period: { startDate: Date; endDate: Date };
    predictions: number;
    correctPredictions: number;
    avgError: number;
    maxError: number;
    minError: number;
  };
}

interface FeatureEngineering {
  rawFeatures: Record<string, number>;
  engineeredFeatures: Record<string, number>;
  featureImportance: Record<string, number>;
  correlationMatrix: Record<string, Record<string, number>>;
}

export class PredictiveModelingService {
  private eventPublisher: EventPublisher;
  private models: Map<string, PredictiveModel> = new Map();
  private predictions: Map<string, PredictiveInsight> = new Map();
  private modelPerformance: Map<string, ModelPerformanceMetrics> = new Map();

  private defaultHyperparameters = new Map([
    ['regression', {
      learningRate: 0.01,
      maxDepth: 6,
      nEstimators: 100,
      minSamplesLeaf: 1,
      regularization: 0.1
    }],
    ['time_series', {
      seasonalPeriods: 252, // Trading days in a year
      trendOrder: 1,
      seasonalOrder: 1,
      lookbackWindow: 60,
      forecastHorizon: 30
    }],
    ['classification', {
      learningRate: 0.01,
      maxDepth: 5,
      nEstimators: 200,
      minSamplesLeaf: 2,
      classWeight: 'balanced'
    }],
    ['clustering', {
      nClusters: 8,
      maxIterations: 300,
      tolerance: 1e-4,
      initialization: 'k-means++'
    }],
    ['deep_learning', {
      hiddenLayers: [128, 64, 32],
      dropout: 0.2,
      learningRate: 0.001,
      batchSize: 32,
      epochs: 100,
      patience: 10
    }]
  ]);

  constructor() {
    this.eventPublisher = new EventPublisher();
    this.initializePredefinedModels();
  }

  async trainModel(request: ModelTrainingRequest): Promise<PredictiveModel> {
    try {
      logger.info('Training predictive model', {
        tenantId: request.tenantId,
        modelType: request.modelType,
        targetVariable: request.targetVariable
      });

      // Prepare training data
      const trainingData = await this.prepareTrainingData(request);
      
      // Feature engineering
      const engineeredFeatures = await this.performFeatureEngineering(trainingData, request.features);
      
      // Get hyperparameters
      const hyperparameters = {
        ...this.defaultHyperparameters.get(request.modelType),
        ...request.hyperparameters
      };

      // Create model instance
      const model: PredictiveModel = {
        id: randomUUID(),
        name: this.generateModelName(request.modelType, request.targetVariable),
        description: this.generateModelDescription(request.modelType, request.targetVariable),
        modelType: request.modelType,
        algorithm: this.selectAlgorithm(request.modelType),
        targetVariable: request.targetVariable,
        features: engineeredFeatures.engineeredFeatures ? Object.keys(engineeredFeatures.engineeredFeatures) : request.features,
        hyperparameters,
        performance: await this.calculateInitialPerformance(),
        trainingData: {
          startDate: request.trainingPeriod.startDate,
          endDate: request.trainingPeriod.endDate,
          recordCount: trainingData.length
        },
        lastTrainingDate: new Date(),
        nextTrainingDate: this.calculateNextTrainingDate(request.modelType),
        status: 'training',
        version: '1.0.0',
        createdBy: 'system',
        createdAt: new Date()
      };

      // Simulate model training process
      await this.executeTraining(model, trainingData, engineeredFeatures);
      
      // Validate model performance
      const performance = await this.validateModel(model, trainingData);
      model.performance = performance;
      model.status = performance.accuracy && performance.accuracy > 0.7 ? 'ready' : 'failed';

      // Store model
      this.models.set(model.id, model);
      this.modelPerformance.set(model.id, {
        modelId: model.id,
        ...performance
      });

      await this.eventPublisher.publish('analytics.model.trained', {
        tenantId: request.tenantId,
        modelId: model.id,
        modelType: request.modelType,
        performance: model.performance,
        status: model.status
      });

      return model;

    } catch (error) {
      logger.error('Error training predictive model:', error);
      throw error;
    }
  }

  async generatePrediction(request: PredictionRequest): Promise<PredictiveInsight> {
    try {
      logger.info('Generating prediction', {
        modelId: request.modelId,
        entityId: request.entityId,
        predictionType: request.predictionType
      });

      const model = this.models.get(request.modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      if (model.status !== 'ready') {
        throw new Error(`Model is not ready for predictions. Status: ${model.status}`);
      }

      // Feature preprocessing
      const processedFeatures = await this.preprocessFeatures(request.features, model);
      
      // Generate prediction based on model type
      const predictionResult = await this.executePrediction(model, processedFeatures, request);
      
      // Calculate confidence and intervals
      const confidence = await this.calculatePredictionConfidence(model, processedFeatures);
      const confidenceInterval = await this.calculateConfidenceInterval(predictionResult.value, confidence);
      
      // Generate explanation
      const explanation = await this.generatePredictionExplanation(model, processedFeatures, predictionResult);

      const insight: PredictiveInsight = {
        id: randomUUID(),
        modelId: request.modelId,
        entityId: request.entityId,
        entityType: request.entityType,
        predictionType: request.predictionType,
        prediction: {
          value: predictionResult.value,
          confidence,
          confidenceInterval,
          horizon: request.horizon,
          unit: request.unit
        },
        features: processedFeatures,
        explanation,
        generatedAt: new Date(),
        validUntil: this.calculatePredictionExpiry(request.horizon, request.unit)
      };

      // Store prediction
      this.predictions.set(insight.id, insight);

      await this.eventPublisher.publish('analytics.prediction.generated', {
        modelId: request.modelId,
        predictionId: insight.id,
        entityId: request.entityId,
        predictionType: request.predictionType,
        confidence: confidence
      });

      return insight;

    } catch (error) {
      logger.error('Error generating prediction:', error);
      throw error;
    }
  }

  async retrainModel(
    modelId: string,
    newTrainingPeriod?: { startDate: Date; endDate: Date }
  ): Promise<PredictiveModel> {
    try {
      logger.info('Retraining model', { modelId });

      const existingModel = this.models.get(modelId);
      if (!existingModel) {
        throw new Error('Model not found');
      }

      // Prepare new training request
      const retrainingRequest: ModelTrainingRequest = {
        tenantId: 'system', // Would be extracted from context
        modelType: existingModel.modelType,
        targetVariable: existingModel.targetVariable,
        features: existingModel.features,
        trainingPeriod: newTrainingPeriod || {
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
          endDate: new Date()
        },
        hyperparameters: existingModel.hyperparameters
      };

      // Train new version
      const retrainedModel = await this.trainModel(retrainingRequest);
      
      // Update version
      const currentVersion = parseFloat(existingModel.version);
      retrainedModel.version = (currentVersion + 0.1).toFixed(1);
      
      // Compare performance
      const performanceImprovement = await this.compareModelPerformance(existingModel, retrainedModel);
      
      if (performanceImprovement > 0.05) { // 5% improvement threshold
        // Update existing model
        retrainedModel.id = existingModel.id;
        this.models.set(modelId, retrainedModel);
        
        await this.eventPublisher.publish('analytics.model.retrained', {
          modelId,
          previousVersion: existingModel.version,
          newVersion: retrainedModel.version,
          performanceImprovement
        });
      } else {
        // Keep existing model
        logger.info('Model retraining did not improve performance significantly', { modelId });
      }

      return this.models.get(modelId)!;

    } catch (error) {
      logger.error('Error retraining model:', error);
      throw error;
    }
  }

  async getModelPerformance(modelId: string): Promise<ModelPerformanceMetrics> {
    const performance = this.modelPerformance.get(modelId);
    if (!performance) {
      throw new Error('Model performance data not found');
    }
    return performance;
  }

  async backtestModel(
    modelId: string,
    backtestPeriod: { startDate: Date; endDate: Date }
  ): Promise<ModelPerformanceMetrics> {
    try {
      logger.info('Running model backtest', { modelId, backtestPeriod });

      const model = this.models.get(modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // Generate historical predictions
      const backtestData = await this.generateBacktestData(model, backtestPeriod);
      const predictions: number[] = [];
      const actuals: number[] = [];

      for (const dataPoint of backtestData) {
        const prediction = await this.executePrediction(model, dataPoint.features, {
          modelId: model.id,
          entityId: dataPoint.entityId,
          entityType: 'portfolio',
          predictionType: 'performance',
          horizon: 1,
          unit: 'days',
          features: dataPoint.features
        });
        
        predictions.push(prediction.value);
        actuals.push(dataPoint.actualValue);
      }

      // Calculate backtest metrics
      const backtestResults = {
        period: backtestPeriod,
        predictions: predictions.length,
        correctPredictions: this.countCorrectPredictions(predictions, actuals),
        avgError: this.calculateMeanError(predictions, actuals),
        maxError: this.calculateMaxError(predictions, actuals),
        minError: this.calculateMinError(predictions, actuals)
      };

      const updatedPerformance: ModelPerformanceMetrics = {
        modelId,
        ...model.performance,
        backtestResults
      };

      this.modelPerformance.set(modelId, updatedPerformance);

      return updatedPerformance;

    } catch (error) {
      logger.error('Error running model backtest:', error);
      throw error;
    }
  }

  async getPredictionsForEntity(
    entityId: string,
    entityType: 'portfolio' | 'position' | 'client',
    validOnly: boolean = true
  ): Promise<PredictiveInsight[]> {
    const now = new Date();
    return Array.from(this.predictions.values()).filter(prediction => 
      prediction.entityId === entityId && 
      prediction.entityType === entityType &&
      (!validOnly || prediction.validUntil > now)
    );
  }

  async getAvailableModels(
    tenantId?: string,
    modelType?: PredictiveModel['modelType']
  ): Promise<PredictiveModel[]> {
    let models = Array.from(this.models.values()).filter(model => model.status === 'ready');
    
    if (modelType) {
      models = models.filter(model => model.modelType === modelType);
    }
    
    return models.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private async prepareTrainingData(request: ModelTrainingRequest): Promise<any[]> {
    // Mock training data preparation
    const dataPoints: any[] = [];
    const daysDiff = Math.ceil((request.trainingPeriod.endDate.getTime() - request.trainingPeriod.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < Math.min(daysDiff, 1000); i++) {
      const date = new Date(request.trainingPeriod.startDate);
      date.setDate(date.getDate() + i);
      
      const dataPoint: any = {
        date,
        target: Math.random() * 100 - 50, // Random target value
        features: {}
      };
      
      // Generate feature values
      request.features.forEach(feature => {
        dataPoint.features[feature] = Math.random() * 100;
      });
      
      dataPoints.push(dataPoint);
    }
    
    return dataPoints;
  }

  private async performFeatureEngineering(trainingData: any[], features: string[]): Promise<FeatureEngineering> {
    const rawFeatures: Record<string, number> = {};
    const engineeredFeatures: Record<string, number> = {};
    const featureImportance: Record<string, number> = {};
    const correlationMatrix: Record<string, Record<string, number>> = {};

    // Calculate feature statistics
    features.forEach(feature => {
      const values = trainingData.map(d => d.features[feature]);
      rawFeatures[feature] = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // Create engineered features
      engineeredFeatures[`${feature}_ma_5`] = this.calculateMovingAverage(values, 5);
      engineeredFeatures[`${feature}_ma_20`] = this.calculateMovingAverage(values, 20);
      engineeredFeatures[`${feature}_volatility`] = this.calculateVolatility(values);
      engineeredFeatures[`${feature}_trend`] = this.calculateTrend(values);
      
      // Mock feature importance
      featureImportance[feature] = Math.random();
    });

    // Normalize feature importance
    const totalImportance = Object.values(featureImportance).reduce((sum, val) => sum + val, 0);
    Object.keys(featureImportance).forEach(feature => {
      featureImportance[feature] /= totalImportance;
    });

    // Calculate correlation matrix
    features.forEach(feature1 => {
      correlationMatrix[feature1] = {};
      features.forEach(feature2 => {
        correlationMatrix[feature1][feature2] = this.calculateCorrelation(
          trainingData.map(d => d.features[feature1]),
          trainingData.map(d => d.features[feature2])
        );
      });
    });

    return {
      rawFeatures,
      engineeredFeatures,
      featureImportance,
      correlationMatrix
    };
  }

  private selectAlgorithm(modelType: PredictiveModel['modelType']): string {
    const algorithms = {
      regression: 'Gradient Boosting Regressor',
      classification: 'Random Forest Classifier',
      time_series: 'LSTM Neural Network',
      clustering: 'K-Means Clustering',
      deep_learning: 'Deep Neural Network'
    };
    
    return algorithms[modelType] || 'Linear Regression';
  }

  private async calculateInitialPerformance(): Promise<PredictiveModel['performance']> {
    return {
      accuracy: 0.0,
      precision: 0.0,
      recall: 0.0,
      f1Score: 0.0,
      mse: 0.0,
      mae: 0.0,
      r2: 0.0
    };
  }

  private calculateNextTrainingDate(modelType: PredictiveModel['modelType']): Date {
    const retrainIntervals = {
      regression: 30,  // 30 days
      classification: 14, // 14 days
      time_series: 7, // 7 days
      clustering: 60, // 60 days
      deep_learning: 21 // 21 days
    };
    
    const days = retrainIntervals[modelType] || 30;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private async executeTraining(model: PredictiveModel, trainingData: any[], features: FeatureEngineering): Promise<void> {
    // Mock training execution
    logger.info('Executing model training', { modelId: model.id, algorithm: model.algorithm });
    
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async validateModel(model: PredictiveModel, trainingData: any[]): Promise<PredictiveModel['performance']> {
    // Mock model validation
    const validationSplit = 0.2;
    const validationSize = Math.floor(trainingData.length * validationSplit);
    
    return {
      accuracy: 0.75 + Math.random() * 0.2, // 75-95% accuracy
      precision: 0.7 + Math.random() * 0.25,
      recall: 0.68 + Math.random() * 0.27,
      f1Score: 0.72 + Math.random() * 0.23,
      mse: Math.random() * 10,
      mae: Math.random() * 5,
      r2: 0.6 + Math.random() * 0.35
    };
  }

  private async preprocessFeatures(features: Record<string, number>, model: PredictiveModel): Promise<Record<string, number>> {
    const processed: Record<string, number> = {};
    
    // Apply same preprocessing as during training
    Object.entries(features).forEach(([key, value]) => {
      // Normalization, scaling, etc.
      processed[key] = this.scaleFeature(value, key);
    });
    
    return processed;
  }

  private async executePrediction(
    model: PredictiveModel,
    features: Record<string, number>,
    request: PredictionRequest
  ): Promise<{ value: number; metadata?: any }> {
    // Mock prediction execution based on model type
    let value: number;
    
    switch (model.modelType) {
      case 'regression':
        value = this.executeRegressionPrediction(features, model);
        break;
      case 'time_series':
        value = this.executeTimeSeriesPrediction(features, model, request.horizon);
        break;
      case 'classification':
        value = this.executeClassificationPrediction(features, model);
        break;
      default:
        value = Math.random() * 100 - 50; // Random prediction
    }
    
    return { value };
  }

  private executeRegressionPrediction(features: Record<string, number>, model: PredictiveModel): number {
    // Simple linear combination with some noise
    const weights = Object.keys(features).map(() => Math.random() * 2 - 1);
    const values = Object.values(features);
    
    const prediction = weights.reduce((sum, weight, i) => sum + weight * values[i], 0);
    return prediction + (Math.random() * 10 - 5); // Add noise
  }

  private executeTimeSeriesPrediction(features: Record<string, number>, model: PredictiveModel, horizon: number): number {
    // Mock time series prediction with trend and seasonality
    const baseValue = Object.values(features).reduce((sum, val) => sum + val, 0) / Object.keys(features).length;
    const trend = 0.02 * horizon; // 2% trend per unit
    const seasonality = Math.sin(2 * Math.PI * horizon / 252) * 5; // Seasonal component
    const noise = (Math.random() - 0.5) * 2;
    
    return baseValue * (1 + trend) + seasonality + noise;
  }

  private executeClassificationPrediction(features: Record<string, number>, model: PredictiveModel): number {
    // Mock classification - return probability
    const score = Object.values(features).reduce((sum, val) => sum + val, 0);
    return 1 / (1 + Math.exp(-score / 100)); // Sigmoid function
  }

  private async calculatePredictionConfidence(model: PredictiveModel, features: Record<string, number>): Promise<number> {
    // Mock confidence calculation based on model performance and feature quality
    const baseConfidence = model.performance.accuracy || 0.8;
    const featureQuality = this.assessFeatureQuality(features);
    
    return Math.min(0.99, Math.max(0.1, baseConfidence * featureQuality));
  }

  private async calculateConfidenceInterval(prediction: number, confidence: number): Promise<{ lower: number; upper: number }> {
    const margin = Math.abs(prediction) * (1 - confidence) + 5;
    return {
      lower: prediction - margin,
      upper: prediction + margin
    };
  }

  private async generatePredictionExplanation(
    model: PredictiveModel,
    features: Record<string, number>,
    prediction: { value: number }
  ): Promise<PredictiveInsight['explanation']> {
    // Mock SHAP-like explanation
    const topFactors = Object.entries(features)
      .map(([feature, value]) => ({
        feature,
        impact: (Math.random() - 0.5) * Math.abs(prediction.value) * 0.2,
        direction: Math.random() > 0.5 ? 'positive' : 'negative' as const
      }))
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 5);

    const shap_values: Record<string, number> = {};
    Object.keys(features).forEach(feature => {
      shap_values[feature] = (Math.random() - 0.5) * 10;
    });

    return {
      topFactors,
      shap_values
    };
  }

  private calculatePredictionExpiry(horizon: number, unit: string): Date {
    const expiryDate = new Date();
    const multiplier = unit === 'days' ? 1 : unit === 'weeks' ? 7 : unit === 'months' ? 30 : 365;
    expiryDate.setDate(expiryDate.getDate() + horizon * multiplier);
    return expiryDate;
  }

  private async compareModelPerformance(oldModel: PredictiveModel, newModel: PredictiveModel): Promise<number> {
    const oldAccuracy = oldModel.performance.accuracy || 0;
    const newAccuracy = newModel.performance.accuracy || 0;
    return newAccuracy - oldAccuracy;
  }

  private async generateBacktestData(model: PredictiveModel, period: { startDate: Date; endDate: Date }): Promise<any[]> {
    // Mock backtest data generation
    const data: any[] = [];
    const daysDiff = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < Math.min(daysDiff, 100); i++) {
      const date = new Date(period.startDate);
      date.setDate(date.getDate() + i);
      
      const features: Record<string, number> = {};
      model.features.forEach(feature => {
        features[feature] = Math.random() * 100;
      });
      
      data.push({
        date,
        entityId: 'test-portfolio',
        features,
        actualValue: Math.random() * 100 - 50
      });
    }
    
    return data;
  }

  private countCorrectPredictions(predictions: number[], actuals: number[]): number {
    let correct = 0;
    const threshold = 0.1; // 10% threshold for "correct" predictions
    
    for (let i = 0; i < predictions.length; i++) {
      const error = Math.abs(predictions[i] - actuals[i]) / Math.abs(actuals[i]);
      if (error <= threshold) {
        correct++;
      }
    }
    
    return correct;
  }

  private calculateMeanError(predictions: number[], actuals: number[]): number {
    const errors = predictions.map((pred, i) => Math.abs(pred - actuals[i]));
    return errors.reduce((sum, error) => sum + error, 0) / errors.length;
  }

  private calculateMaxError(predictions: number[], actuals: number[]): number {
    const errors = predictions.map((pred, i) => Math.abs(pred - actuals[i]));
    return Math.max(...errors);
  }

  private calculateMinError(predictions: number[], actuals: number[]): number {
    const errors = predictions.map((pred, i) => Math.abs(pred - actuals[i]));
    return Math.min(...errors);
  }

  private generateModelName(modelType: string, targetVariable: string): string {
    const typeNames = {
      regression: 'Regression',
      classification: 'Classification',
      time_series: 'Time Series',
      clustering: 'Clustering',
      deep_learning: 'Deep Learning'
    };
    
    return `${typeNames[modelType] || 'ML'} Model - ${targetVariable}`;
  }

  private generateModelDescription(modelType: string, targetVariable: string): string {
    return `Predictive model for ${targetVariable} using ${modelType} approach with automated feature engineering and hyperparameter optimization.`;
  }

  private calculateMovingAverage(values: number[], window: number): number {
    if (values.length < window) return values.reduce((sum, val) => sum + val, 0) / values.length;
    const recent = values.slice(-window);
    return recent.reduce((sum, val) => sum + val, 0) / recent.length;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    // Simple linear trend calculation
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private scaleFeature(value: number, featureName: string): number {
    // Mock feature scaling - in reality would use stored scaling parameters
    return (value - 50) / 25; // Standardize assuming mean=50, std=25
  }

  private assessFeatureQuality(features: Record<string, number>): number {
    // Mock feature quality assessment
    const completeness = Object.values(features).filter(val => !isNaN(val) && val !== null).length / Object.keys(features).length;
    const variance = this.calculateVolatility(Object.values(features));
    const qualityScore = (completeness * 0.7) + (Math.min(variance / 50, 1) * 0.3);
    
    return Math.max(0.3, Math.min(1.0, qualityScore));
  }

  private initializePredefinedModels(): void {
    // Initialize common predictive models
    const portfolioPerformanceModel: PredictiveModel = {
      id: 'portfolio-performance-lstm',
      name: 'Portfolio Performance Predictor',
      description: 'LSTM-based model for predicting portfolio performance using market indicators and historical data',
      modelType: 'time_series',
      algorithm: 'LSTM Neural Network',
      targetVariable: 'portfolio_return',
      features: ['market_return', 'volatility', 'volume', 'sentiment', 'sector_rotation'],
      hyperparameters: this.defaultHyperparameters.get('time_series')!,
      performance: {
        accuracy: 0.82,
        mse: 2.34,
        mae: 1.67,
        r2: 0.79
      },
      trainingData: {
        startDate: new Date('2020-01-01'),
        endDate: new Date('2024-01-01'),
        recordCount: 1000
      },
      lastTrainingDate: new Date('2024-01-01'),
      nextTrainingDate: new Date('2024-02-01'),
      status: 'ready',
      version: '2.1.0',
      createdBy: 'system',
      createdAt: new Date('2023-01-01')
    };

    const riskAssessmentModel: PredictiveModel = {
      id: 'risk-assessment-rf',
      name: 'Risk Assessment Model',
      description: 'Random Forest model for assessing portfolio risk levels and VaR predictions',
      modelType: 'regression',
      algorithm: 'Random Forest Regressor',
      targetVariable: 'var_95',
      features: ['correlation_matrix', 'volatility_surface', 'beta', 'sector_exposure', 'concentration'],
      hyperparameters: this.defaultHyperparameters.get('regression')!,
      performance: {
        accuracy: 0.78,
        mse: 3.12,
        mae: 2.18,
        r2: 0.74
      },
      trainingData: {
        startDate: new Date('2019-01-01'),
        endDate: new Date('2024-01-01'),
        recordCount: 1250
      },
      lastTrainingDate: new Date('2024-01-01'),
      nextTrainingDate: new Date('2024-01-15'),
      status: 'ready',
      version: '1.8.0',
      createdBy: 'system',
      createdAt: new Date('2023-06-01')
    };

    this.models.set(portfolioPerformanceModel.id, portfolioPerformanceModel);
    this.models.set(riskAssessmentModel.id, riskAssessmentModel);
  }
}
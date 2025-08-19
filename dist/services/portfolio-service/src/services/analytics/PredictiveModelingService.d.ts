import { PredictiveModel, PredictiveInsight } from '../../models/analytics/Analytics';
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
        period: {
            startDate: Date;
            endDate: Date;
        };
        predictions: number;
        correctPredictions: number;
        avgError: number;
        maxError: number;
        minError: number;
    };
}
export declare class PredictiveModelingService {
    private eventPublisher;
    private models;
    private predictions;
    private modelPerformance;
    private defaultHyperparameters;
    constructor();
    trainModel(request: ModelTrainingRequest): Promise<PredictiveModel>;
    generatePrediction(request: PredictionRequest): Promise<PredictiveInsight>;
    retrainModel(modelId: string, newTrainingPeriod?: {
        startDate: Date;
        endDate: Date;
    }): Promise<PredictiveModel>;
    getModelPerformance(modelId: string): Promise<ModelPerformanceMetrics>;
    backtestModel(modelId: string, backtestPeriod: {
        startDate: Date;
        endDate: Date;
    }): Promise<ModelPerformanceMetrics>;
    getPredictionsForEntity(entityId: string, entityType: 'portfolio' | 'position' | 'client', validOnly?: boolean): Promise<PredictiveInsight[]>;
    getAvailableModels(tenantId?: string, modelType?: PredictiveModel['modelType']): Promise<PredictiveModel[]>;
    private prepareTrainingData;
    private performFeatureEngineering;
    private selectAlgorithm;
    private calculateInitialPerformance;
    private calculateNextTrainingDate;
    private executeTraining;
    private validateModel;
    private preprocessFeatures;
    private executePrediction;
    private executeRegressionPrediction;
    private executeTimeSeriesPrediction;
    private executeClassificationPrediction;
    private calculatePredictionConfidence;
    private calculateConfidenceInterval;
    private generatePredictionExplanation;
    private calculatePredictionExpiry;
    private compareModelPerformance;
    private generateBacktestData;
    private countCorrectPredictions;
    private calculateMeanError;
    private calculateMaxError;
    private calculateMinError;
    private generateModelName;
    private generateModelDescription;
    private calculateMovingAverage;
    private calculateVolatility;
    private calculateTrend;
    private calculateCorrelation;
    private scaleFeature;
    private assessFeatureQuality;
    private initializePredefinedModels;
}
export {};

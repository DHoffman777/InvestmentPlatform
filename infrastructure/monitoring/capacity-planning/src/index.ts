export * from './CapacityPlanningDataModel';
export * from './ResourceUsagePredictionService';
export * from './ScalingThresholdMonitor';
export * from './CapacityTrendAnalyzer';
export * from './AutomatedScalingRecommendationEngine';
export * from './CapacityPlanningReportGenerator';
export * from './CostOptimizationService';
export * from './CapacityAlertWorkflowManager';
export * from './CapacityPlanningController';

import { ResourceUsagePredictionService } from './ResourceUsagePredictionService';
import { ScalingThresholdMonitor } from './ScalingThresholdMonitor';
import { CapacityTrendAnalyzer } from './CapacityTrendAnalyzer';
import { AutomatedScalingRecommendationEngine } from './AutomatedScalingRecommendationEngine';
import { CapacityPlanningReportGenerator } from './CapacityPlanningReportGenerator';
import { CostOptimizationService } from './CostOptimizationService';
import { CapacityAlertWorkflowManager } from './CapacityAlertWorkflowManager';
import { CapacityPlanningController } from './CapacityPlanningController';

export interface CapacityPlanningSystemConfig {
  prediction: {
    dataRetentionDays: number;
    defaultLookbackPeriod: number;
    defaultPredictionHorizon: number;
    modelRetrainingInterval: number;
    minDataPointsForPrediction: number;
    enableAutoModelSelection: boolean;
    modelAccuracyThreshold: number;
    parallelPredictions: number;
  };
  thresholdMonitoring: {
    evaluationInterval: number;
    alertCooldownPeriod: number;
    maxConcurrentAlerts: number;
    enableAutoScaling: boolean;
    defaultThresholds: Record<string, number>;
    escalationRules: Array<{
      timeToEscalate: number;
      escalationLevel: number;
      actions: any[];
    }>;
    notificationChannels: Array<{
      type: string;
      configuration: Record<string, any>;
      isActive: boolean;
      priority: number;
    }>;
  };
  trendAnalysis: {
    analysisInterval: number;
    minDataPoints: number;
    seasonalityDetectionThreshold: number;
    changePointSensitivity: number;
    forecastHorizon: number;
    confidenceThreshold: number;
    enableSeasonalityDetection: boolean;
    enableChangePointDetection: boolean;
    enableForecastGeneration: boolean;
  };
  recommendations: {
    evaluationInterval: number;
    recommendationValidityPeriod: number;
    minConfidenceThreshold: number;
    maxRecommendationsPerResource: number;
    enableProactiveRecommendations: boolean;
    enableCostOptimization: boolean;
    enablePerformanceTuning: boolean;
    riskTolerance: 'low' | 'medium' | 'high';
    businessHours: {
      start: number;
      end: number;
      timezone: string;
    };
    scalingConstraints: {
      maxScaleUpFactor: number;
      maxScaleDownFactor: number;
      minCooldownPeriod: number;
      maxConcurrentScalings: number;
      budgetLimit: number;
      maintenanceWindows: Array<{
        start: Date;
        end: Date;
        recurring: boolean;
      }>;
      dependencies: Record<string, string[]>;
    };
  };
  reporting: {
    defaultFormat: string[];
    maxReportsPerDay: number;
    reportRetentionDays: number;
    enableScheduledReports: boolean;
    templateDirectory: string;
    outputDirectory: string;
    emailSettings: {
      enabled: boolean;
      smtpHost: string;
      smtpPort: number;
      fromAddress: string;
    };
  };
  costOptimization: {
    analysisInterval: number;
    minSavingsThreshold: number;
    maxRiskTolerance: number;
    enableRealTimeOptimization: boolean;
    costDataSources: Array<{
      type: 'aws' | 'azure' | 'gcp' | 'internal';
      configuration: Record<string, any>;
      isActive: boolean;
    }>;
    optimizationStrategies: Array<{
      type: string;
      enabled: boolean;
      parameters: Record<string, any>;
      minSavingsPercentage: number;
    }>;
    budgetConstraints: Array<{
      resourceType: string;
      monthlyBudget: number;
      alertThreshold: number;
    }>;
  };
  workflows: {
    enableAutoEscalation: boolean;
    escalationTimeouts: Record<string, number>;
    maxEscalationLevel: number;
    enableAutoRemediation: boolean;
    remediationApprovalRequired: boolean;
    workflowTemplates: any[];
    integrations: Array<{
      type: string;
      configuration: Record<string, any>;
      isActive: boolean;
    }>;
  };
  api: {
    port: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    enableCors: boolean;
    enableCompression: boolean;
    maxPayloadSize: string;
    apiVersion: string;
    authenticationRequired: boolean;
    enableSwaggerDocs: boolean;
    metricsEnabled: boolean;
  };
}

export class CapacityPlanningSystem {
  private predictionService: ResourceUsagePredictionService;
  private thresholdMonitor: ScalingThresholdMonitor;
  private trendAnalyzer: CapacityTrendAnalyzer;
  private recommendationEngine: AutomatedScalingRecommendationEngine;
  private reportGenerator: CapacityPlanningReportGenerator;
  private costOptimizationService: CostOptimizationService;
  private workflowManager: CapacityAlertWorkflowManager;
  private apiController: CapacityPlanningController;

  constructor(config: CapacityPlanningSystemConfig) {
    this.predictionService = new ResourceUsagePredictionService(config.prediction);
    this.thresholdMonitor = new ScalingThresholdMonitor(config.thresholdMonitoring);
    this.trendAnalyzer = new CapacityTrendAnalyzer(config.trendAnalysis);
    this.recommendationEngine = new AutomatedScalingRecommendationEngine(config.recommendations);
    this.reportGenerator = new CapacityPlanningReportGenerator(config.reporting);
    this.costOptimizationService = new CostOptimizationService(config.costOptimization);
    this.workflowManager = new CapacityAlertWorkflowManager(config.workflows);

    this.apiController = new CapacityPlanningController(config.api, {
      predictionService: this.predictionService,
      thresholdMonitor: this.thresholdMonitor,
      trendAnalyzer: this.trendAnalyzer,
      recommendationEngine: this.recommendationEngine,
      reportGenerator: this.reportGenerator,
      costOptimizationService: this.costOptimizationService,
      workflowManager: this.workflowManager
    });

    this.setupIntegrations();
  }

  private setupIntegrations(): void {
    // Connect threshold monitor alerts to workflow manager
    this.thresholdMonitor.on('alertCreated', async (event) => {
      const alert = this.thresholdMonitor.getActiveAlerts(event.resourceId);
      if (alert.length > 0) {
        await this.workflowManager.processAlert(alert[0]);
      }
    });

    // Connect prediction service to recommendation engine
    this.predictionService.on('predictionCompleted', async (event) => {
      console.log(`Prediction completed for resource ${event.resourceId}`);
    });

    // Connect trend analyzer to recommendation engine
    this.trendAnalyzer.on('analysisCompleted', async (event) => {
      console.log(`Trend analysis completed for resource ${event.resourceId}`);
    });

    // Connect cost optimization to workflow manager
    this.costOptimizationService.on('analysisCompleted', async (event) => {
      console.log(`Cost optimization analysis completed for resource ${event.resourceId}`);
    });

    // Connect recommendation engine to workflow manager
    this.recommendationEngine.on('recommendationGenerated', async (event) => {
      console.log(`Recommendation generated: ${event.recommendationId} for resource ${event.resourceId}`);
    });

    // Connect report generator events
    this.reportGenerator.on('reportGenerationCompleted', async (event) => {
      console.log(`Report generation completed: ${event.reportId}`);
    });

    // Connect workflow manager events
    this.workflowManager.on('workflowCompleted', async (event) => {
      console.log(`Workflow completed: ${event.executionId}`);
    });
  }

  public getPredictionService(): ResourceUsagePredictionService {
    return this.predictionService;
  }

  public getThresholdMonitor(): ScalingThresholdMonitor {
    return this.thresholdMonitor;
  }

  public getTrendAnalyzer(): CapacityTrendAnalyzer {
    return this.trendAnalyzer;
  }

  public getRecommendationEngine(): AutomatedScalingRecommendationEngine {
    return this.recommendationEngine;
  }

  public getReportGenerator(): CapacityPlanningReportGenerator {
    return this.reportGenerator;
  }

  public getCostOptimizationService(): CostOptimizationService {
    return this.costOptimizationService;
  }

  public getWorkflowManager(): CapacityAlertWorkflowManager {
    return this.workflowManager;
  }

  public getAPIController(): CapacityPlanningController {
    return this.apiController;
  }

  public async start(): Promise<void> {
    console.log('Starting Capacity Planning System...');
    await this.apiController.start();
    console.log('Capacity Planning System started successfully');
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down Capacity Planning System...');
    
    await this.predictionService.shutdown();
    await this.thresholdMonitor.shutdown();
    await this.trendAnalyzer.shutdown();
    await this.recommendationEngine.shutdown();
    await this.reportGenerator.shutdown();
    await this.costOptimizationService.shutdown();
    await this.workflowManager.shutdown();
    
    console.log('Capacity Planning System shutdown complete');
  }
}

export const createCapacityPlanningSystem = (config: CapacityPlanningSystemConfig): CapacityPlanningSystem => {
  return new CapacityPlanningSystem(config);
};

export const getDefaultConfig = (): CapacityPlanningSystemConfig => {
  return {
    prediction: {
      dataRetentionDays: 90,
      defaultLookbackPeriod: 168,
      defaultPredictionHorizon: 24,
      modelRetrainingInterval: 86400000,
      minDataPointsForPrediction: 50,
      enableAutoModelSelection: true,
      modelAccuracyThreshold: 0.7,
      parallelPredictions: 5
    },
    thresholdMonitoring: {
      evaluationInterval: 60000,
      alertCooldownPeriod: 900000,
      maxConcurrentAlerts: 10,
      enableAutoScaling: true,
      defaultThresholds: {
        cpu_usage: 80,
        memory_usage: 85,
        disk_usage: 90
      },
      escalationRules: [{
        timeToEscalate: 300000,
        escalationLevel: 1,
        actions: []
      }],
      notificationChannels: [{
        type: 'email',
        configuration: { enabled: true },
        isActive: true,
        priority: 1
      }]
    },
    trendAnalysis: {
      analysisInterval: 300000,
      minDataPoints: 24,
      seasonalityDetectionThreshold: 0.3,
      changePointSensitivity: 2.0,
      forecastHorizon: 48,
      confidenceThreshold: 0.8,
      enableSeasonalityDetection: true,
      enableChangePointDetection: true,
      enableForecastGeneration: true
    },
    recommendations: {
      evaluationInterval: 1800000,
      recommendationValidityPeriod: 3600000,
      minConfidenceThreshold: 0.7,
      maxRecommendationsPerResource: 5,
      enableProactiveRecommendations: true,
      enableCostOptimization: true,
      enablePerformanceTuning: true,
      riskTolerance: 'medium',
      businessHours: {
        start: 9,
        end: 17,
        timezone: 'UTC'
      },
      scalingConstraints: {
        maxScaleUpFactor: 3.0,
        maxScaleDownFactor: 0.5,
        minCooldownPeriod: 900000,
        maxConcurrentScalings: 3,
        budgetLimit: 50000,
        maintenanceWindows: [],
        dependencies: {}
      }
    },
    reporting: {
      defaultFormat: ['pdf', 'html'],
      maxReportsPerDay: 50,
      reportRetentionDays: 30,
      enableScheduledReports: true,
      templateDirectory: './templates',
      outputDirectory: './reports',
      emailSettings: {
        enabled: false,
        smtpHost: '',
        smtpPort: 587,
        fromAddress: ''
      }
    },
    costOptimization: {
      analysisInterval: 86400000,
      minSavingsThreshold: 100,
      maxRiskTolerance: 0.3,
      enableRealTimeOptimization: false,
      costDataSources: [],
      optimizationStrategies: [],
      budgetConstraints: []
    },
    workflows: {
      enableAutoEscalation: true,
      escalationTimeouts: {
        critical: 300000,
        high: 900000,
        medium: 1800000,
        low: 3600000
      },
      maxEscalationLevel: 3,
      enableAutoRemediation: false,
      remediationApprovalRequired: true,
      workflowTemplates: [],
      integrations: []
    },
    api: {
      port: 3000,
      rateLimitWindowMs: 900000,
      rateLimitMaxRequests: 1000,
      enableCors: true,
      enableCompression: true,
      maxPayloadSize: '10mb',
      apiVersion: 'v1',
      authenticationRequired: false,
      enableSwaggerDocs: true,
      metricsEnabled: true
    }
  };
};
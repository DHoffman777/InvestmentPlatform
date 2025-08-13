export * from './BusinessMetricsDataModel';
export * from './MetricsCollectionPipeline';
export * from './DashboardTemplateSystem';
export * from './RealTimeMetricsStreaming';
export * from './BusinessThresholdAlerting';
export * from './ExecutiveReportingDashboard';
export * from './DrillDownCapabilities';
export * from './BusinessMetricsController';

import { MetricsCollectionPipeline, CollectionConfig } from './MetricsCollectionPipeline';
import { DashboardTemplateSystem } from './DashboardTemplateSystem';
import { RealTimeMetricsStreaming, StreamingConfig } from './RealTimeMetricsStreaming';
import { BusinessThresholdAlerting } from './BusinessThresholdAlerting';
import { ExecutiveReportingDashboard, ExecutiveDashboardConfig } from './ExecutiveReportingDashboard';
import { DrillDownCapabilities } from './DrillDownCapabilities';
import { BusinessMetricsController, BusinessMetricsAPIConfig } from './BusinessMetricsController';

export interface BusinessMetricsSystemConfig {
  collection: CollectionConfig;
  streaming: StreamingConfig;
  executive: ExecutiveDashboardConfig;
  api: BusinessMetricsAPIConfig;
}

export class BusinessMetricsSystem {
  private collectionPipeline: MetricsCollectionPipeline;
  private dashboardSystem: DashboardTemplateSystem;
  private streamingService: RealTimeMetricsStreaming;
  private alertingSystem: BusinessThresholdAlerting;
  private executiveDashboard: ExecutiveReportingDashboard;
  private drillDownService: DrillDownCapabilities;
  private apiController: BusinessMetricsController;

  constructor(config: BusinessMetricsSystemConfig) {
    this.collectionPipeline = new MetricsCollectionPipeline(config.collection);
    this.dashboardSystem = new DashboardTemplateSystem();
    this.streamingService = new RealTimeMetricsStreaming(config.streaming);
    this.alertingSystem = new BusinessThresholdAlerting();
    this.executiveDashboard = new ExecutiveReportingDashboard(config.executive);
    this.drillDownService = new DrillDownCapabilities();

    this.apiController = new BusinessMetricsController(config.api, {
      collectionPipeline: this.collectionPipeline,
      dashboardSystem: this.dashboardSystem,
      streamingService: this.streamingService,
      alertingSystem: this.alertingSystem,
      executiveDashboard: this.executiveDashboard,
      drillDownService: this.drillDownService
    });

    this.setupIntegrations();
  }

  private setupIntegrations(): void {
    this.collectionPipeline.on('metricValuesBatch', (event) => {
      event.values.forEach(value => {
        this.streamingService.publishMetricUpdate(value);
        this.alertingSystem.evaluateMetricValue(value);
      });
    });

    this.alertingSystem.on('alertTriggered', (event) => {
      this.streamingService.publishAlert(event);
    });

    this.executiveDashboard.on('executiveSummaryGenerated', (event) => {
      console.log(`Executive summary generated for tenant ${event.tenantId}: ${event.summaryId}`);
    });

    this.drillDownService.on('drillDownPerformed', (event) => {
      console.log(`Drill-down performed: ${event.level} with ${event.dataPoints} data points`);
    });
  }

  public getCollectionPipeline(): MetricsCollectionPipeline {
    return this.collectionPipeline;
  }

  public getDashboardSystem(): DashboardTemplateSystem {
    return this.dashboardSystem;
  }

  public getStreamingService(): RealTimeMetricsStreaming {
    return this.streamingService;
  }

  public getAlertingSystem(): BusinessThresholdAlerting {
    return this.alertingSystem;
  }

  public getExecutiveDashboard(): ExecutiveReportingDashboard {
    return this.executiveDashboard;
  }

  public getDrillDownService(): DrillDownCapabilities {
    return this.drillDownService;
  }

  public getAPIController(): BusinessMetricsController {
    return this.apiController;
  }

  public async start(): Promise<void> {
    console.log('Starting Business Metrics System...');
    await this.apiController.start();
    console.log('Business Metrics System started successfully');
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down Business Metrics System...');
    
    await this.streamingService.shutdown();
    await this.executiveDashboard.shutdown();
    await this.drillDownService.shutdown();
    
    console.log('Business Metrics System shutdown complete');
  }
}

export const createBusinessMetricsSystem = (config: BusinessMetricsSystemConfig): BusinessMetricsSystem => {
  return new BusinessMetricsSystem(config);
};

export const getDefaultConfig = (): BusinessMetricsSystemConfig => {
  return {
    collection: {
      batchSize: 1000,
      flushInterval: 30000,
      maxRetries: 3,
      retryBackoff: 1000,
      compressionEnabled: true,
      encryptionEnabled: true,
      deadLetterQueueEnabled: true
    },
    streaming: {
      port: 8080,
      maxConnections: 1000,
      heartbeatInterval: 30000,
      bufferSize: 10000,
      compressionEnabled: true,
      rateLimitPerClient: 100,
      authenticationRequired: true
    },
    executive: {
      refreshInterval: 300000,
      dataRetentionDays: 90,
      autoExportEnabled: true,
      cacheEnabled: true,
      performanceThresholds: {
        loadTime: 5000,
        dataFreshness: 300000,
        errorRate: 0.01,
        availabilityTarget: 0.999
      }
    },
    api: {
      port: 3000,
      rateLimitWindowMs: 900000,
      rateLimitMaxRequests: 1000,
      enableCors: true,
      enableCompression: true,
      maxPayloadSize: '10mb',
      apiVersion: 'v1',
      authenticationRequired: true
    }
  };
};
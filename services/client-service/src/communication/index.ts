import { CommunicationService } from './CommunicationService';
import { CommunicationAnalyticsService } from './CommunicationAnalyticsService';
import { ComplianceRecordingService } from './ComplianceRecordingService';
import { CommunicationTimelineService } from './CommunicationTimelineService';
import { CommunicationController } from './CommunicationController';

// Configuration interfaces
export interface CommunicationSystemConfig {
  communication: {
    enableMultiChannel: boolean;
    enableCategorization: boolean;
    enableSmartSearch: boolean;
    maxSearchResults: number;
    defaultRetentionDays: number;
    enableNotifications: boolean;
    supportedChannels: string[];
    supportedTypes: string[];
  };
  analytics: {
    enableRealTimeAnalytics: boolean;
    metricsRetentionDays: number;
    sentimentAnalysisEnabled: boolean;
    responseTimeSlaHours: number;
    highVolumeThreshold: number;
    lowSentimentThreshold: number;
    analysisIntervals: {
      realTime: number;
      hourly: number;
      daily: number;
      weekly: number;
    };
    alertThresholds: {
      volumeSpike: number;
      responseTimeDelay: number;
      sentimentDrop: number;
      slaViolation: number;
    };
  };
  recording: {
    enableRecording: boolean;
    defaultRetentionDays: number;
    encryptionEnabled: boolean;
    transcriptionEnabled: boolean;
    realTimeTranscription: boolean;
    qualityMonitoring: boolean;
    consentValidation: boolean;
    storageRedundancy: number;
    compressionLevel: number;
    maxFileSize: number;
    allowedCodecs: string[];
    geographicRestrictions: string[];
    auditFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    alertThresholds: {
      diskSpaceWarning: number;
      qualityDegradation: number;
      retentionExpiry: number;
      consentExpiry: number;
    };
  };
  timeline: {
    defaultViewType: 'chronological' | 'grouped' | 'filtered' | 'summary' | 'interactive';
    maxTimelineLength: number;
    autoRefreshInterval: number;
    enableRealTimeUpdates: boolean;
    enablePredictiveInsights: boolean;
    retentionPeriod: number;
    complianceSettings: {
      auditTrailEnabled: boolean;
      recordingIntegration: boolean;
      complianceValidation: boolean;
      automaticClassification: boolean;
    };
    alertSettings: {
      enableAlerts: boolean;
      defaultEscalationTime: number;
      alertChannels: string[];
      quietHours: {
        enabled: boolean;
        start: string;
        end: string;
        timezone: string;
      };
    };
  };
  api: {
    rateLimiting: {
      windowMs: number;
      maxRequests: number;
      skipSuccessfulRequests: boolean;
    };
    validation: {
      enableStrict: boolean;
      maxContentLength: number;
      allowedFileTypes: string[];
      maxFileSize: number;
    };
    features: {
      enableAnalytics: boolean;
      enableRecording: boolean;
      enableTimeline: boolean;
      enableRealTime: boolean;
    };
    security: {
      enableCors: boolean;
      allowedOrigins: string[];
      enableHelmet: boolean;
      requireAuth: boolean;
    };
  };
  integrations: {
    storageProviders: string[];
    transcriptionServices: string[];
    archivalSystems: string[];
    complianceTools: string[];
    calendarSystems: string[];
    crmSystems: string[];
    documentSystems: string[];
    communicationPlatforms: string[];
  };
}

export class CommunicationSystem {
  private communicationService: CommunicationService;
  private analyticsService?: CommunicationAnalyticsService;
  private recordingService?: ComplianceRecordingService;
  private timelineService?: CommunicationTimelineService;
  private controller: CommunicationController;
  private config: CommunicationSystemConfig;
  private isInitialized: boolean = false;

  constructor(config: Partial<CommunicationSystemConfig> = {}) {
    this.config = this.mergeDefaultConfig(config);
    this.initializeServices();
  }

  private mergeDefaultConfig(userConfig: Partial<CommunicationSystemConfig>): CommunicationSystemConfig {
    const defaultConfig: CommunicationSystemConfig = {
      communication: {
        enableMultiChannel: true,
        enableCategorization: true,
        enableSmartSearch: true,
        maxSearchResults: 1000,
        defaultRetentionDays: 2555, // 7 years
        enableNotifications: true,
        supportedChannels: ['email', 'phone', 'sms', 'chat', 'video_call', 'in_person', 'document', 'portal'],
        supportedTypes: ['email', 'phone', 'sms', 'chat', 'meeting', 'document', 'note']
      },
      analytics: {
        enableRealTimeAnalytics: true,
        metricsRetentionDays: 365,
        sentimentAnalysisEnabled: true,
        responseTimeSlaHours: 24,
        highVolumeThreshold: 50,
        lowSentimentThreshold: 0.3,
        analysisIntervals: {
          realTime: 30000, // 30 seconds
          hourly: 3600000, // 1 hour
          daily: 86400000, // 24 hours
          weekly: 604800000 // 7 days
        },
        alertThresholds: {
          volumeSpike: 25,
          responseTimeDelay: 20,
          sentimentDrop: 10,
          slaViolation: 90
        }
      },
      recording: {
        enableRecording: true,
        defaultRetentionDays: 2555,
        encryptionEnabled: true,
        transcriptionEnabled: true,
        realTimeTranscription: false,
        qualityMonitoring: true,
        consentValidation: true,
        storageRedundancy: 2,
        compressionLevel: 5,
        maxFileSize: 5, // GB
        allowedCodecs: ['AAC', 'MP3', 'H.264', 'H.265'],
        geographicRestrictions: [],
        auditFrequency: 'monthly',
        alertThresholds: {
          diskSpaceWarning: 85,
          qualityDegradation: 70,
          retentionExpiry: 30,
          consentExpiry: 90
        }
      },
      timeline: {
        defaultViewType: 'chronological',
        maxTimelineLength: 1095, // 3 years
        autoRefreshInterval: 60, // seconds
        enableRealTimeUpdates: true,
        enablePredictiveInsights: true,
        retentionPeriod: 2555,
        complianceSettings: {
          auditTrailEnabled: true,
          recordingIntegration: true,
          complianceValidation: true,
          automaticClassification: true
        },
        alertSettings: {
          enableAlerts: true,
          defaultEscalationTime: 4, // hours
          alertChannels: ['email', 'sms'],
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '06:00',
            timezone: 'UTC'
          }
        }
      },
      api: {
        rateLimiting: {
          windowMs: 15 * 60 * 1000,
          maxRequests: 1000,
          skipSuccessfulRequests: false
        },
        validation: {
          enableStrict: true,
          maxContentLength: 10000,
          allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'],
          maxFileSize: 10 * 1024 * 1024
        },
        features: {
          enableAnalytics: true,
          enableRecording: true,
          enableTimeline: true,
          enableRealTime: true
        },
        security: {
          enableCors: true,
          allowedOrigins: ['http://localhost:3000'],
          enableHelmet: true,
          requireAuth: true
        }
      },
      integrations: {
        storageProviders: ['local', 'aws-s3', 'azure-blob'],
        transcriptionServices: ['aws-transcribe', 'google-speech'],
        archivalSystems: ['glacier', 'cold-storage'],
        complianceTools: ['finra-trace', 'sec-edgar'],
        calendarSystems: ['outlook', 'google-calendar'],
        crmSystems: ['salesforce', 'hubspot'],
        documentSystems: ['sharepoint', 'google-drive'],
        communicationPlatforms: ['teams', 'slack', 'zoom']
      }
    };

    return this.deepMerge(defaultConfig, userConfig);
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private initializeServices(): void {
    // Initialize core communication service
    this.communicationService = new CommunicationService({
      enableMultiChannel: this.config.communication.enableMultiChannel,
      enableCategorization: this.config.communication.enableCategorization,
      enableSmartSearch: this.config.communication.enableSmartSearch,
      maxSearchResults: this.config.communication.maxSearchResults,
      defaultRetentionDays: this.config.communication.defaultRetentionDays,
      enableNotifications: this.config.communication.enableNotifications,
      supportedChannels: this.config.communication.supportedChannels,
      supportedTypes: this.config.communication.supportedTypes
    });

    // Initialize analytics service if enabled
    if (this.config.api.features.enableAnalytics) {
      this.analyticsService = new CommunicationAnalyticsService(this.config.analytics);
    }

    // Initialize recording service if enabled
    if (this.config.api.features.enableRecording) {
      this.recordingService = new ComplianceRecordingService(this.config.recording);
    }

    // Initialize timeline service if enabled
    if (this.config.api.features.enableTimeline) {
      this.timelineService = new CommunicationTimelineService(this.config.timeline);
    }

    // Initialize API controller
    this.controller = new CommunicationController(
      this.communicationService,
      this.analyticsService,
      this.recordingService,
      this.timelineService,
      this.config.api
    );

    this.setupServiceIntegrations();
  }

  private setupServiceIntegrations(): void {
    // Set up event-driven integration between services
    
    // Communication service events
    this.communicationService.on('communicationCreated', (event) => {
      // Auto-add to timeline if timeline service is enabled
      if (this.timelineService && this.config.timeline.complianceSettings.recordingIntegration) {
        this.timelineService.addTimelineEntry({
          communicationId: event.communicationId,
          tenantId: event.tenantId,
          clientId: event.clientId,
          employeeId: event.employeeId,
          timestamp: new Date(),
          entryType: 'communication',
          channel: event.channel,
          direction: event.direction,
          status: 'completed',
          priority: event.priority || 'medium',
          subject: event.subject,
          summary: event.summary || event.subject,
          participants: event.participants || [],
          attachments: event.attachments || [],
          tags: event.tags || [],
          categories: event.categories || [],
          relatedEntries: [],
          metrics: {},
          compliance: {
            recordingRequired: false,
            recordingExists: false,
            retentionPeriod: this.config.communication.defaultRetentionDays,
            complianceFlags: [],
            auditTrail: []
          },
          customFields: {
            sourceType: 'communication_service',
            autoGenerated: true
          }
        }).catch(error => {
          console.error('Failed to add communication to timeline:', error);
        });
      }

      // Trigger analytics processing if enabled
      if (this.analyticsService) {
        // Analytics service would process the new communication
        console.log(`Analytics processing communication ${event.communicationId}`);
      }
    });

    // Analytics service events
    if (this.analyticsService) {
      this.analyticsService.on('alertCreated', (alert) => {
        // Timeline service could create alert entries
        if (this.timelineService) {
          this.timelineService.addTimelineEntry({
            communicationId: `alert_${alert.id}`,
            tenantId: alert.tenantId,
            clientId: alert.clientId || 'system',
            employeeId: 'system',
            timestamp: new Date(),
            entryType: 'system_event',
            channel: 'system',
            direction: 'system',
            status: 'completed',
            priority: alert.severity === 'critical' ? 'urgent' : 'high',
            subject: alert.title,
            summary: alert.description,
            participants: [],
            attachments: [],
            tags: ['alert', 'analytics'],
            categories: ['system_alert'],
            relatedEntries: [],
            metrics: {},
            compliance: {
              recordingRequired: false,
              recordingExists: false,
              retentionPeriod: 365,
              complianceFlags: [],
              auditTrail: []
            },
            customFields: {
              alertId: alert.id,
              alertType: alert.type,
              severity: alert.severity,
              autoGenerated: true
            }
          }).catch(error => {
            console.error('Failed to add alert to timeline:', error);
          });
        }
      });
    }

    // Recording service events
    if (this.recordingService) {
      this.recordingService.on('recordingStarted', (event) => {
        // Add recording start to timeline
        if (this.timelineService) {
          this.timelineService.addTimelineEntry({
            communicationId: event.communicationId,
            tenantId: event.tenantId,
            clientId: 'system', // Would need actual client ID from communication
            employeeId: 'system',
            timestamp: new Date(),
            entryType: 'system_event',
            channel: 'system',
            direction: 'system',
            status: 'in_progress',
            priority: 'medium',
            subject: 'Recording Started',
            summary: `Recording session ${event.sessionId} started with ${event.participants} participant(s)`,
            participants: [],
            attachments: [],
            tags: ['recording', 'compliance'],
            categories: ['recording_event'],
            relatedEntries: [],
            metrics: {},
            compliance: {
              recordingRequired: true,
              recordingExists: true,
              retentionPeriod: this.config.recording.defaultRetentionDays,
              complianceFlags: ['RECORDING_IN_PROGRESS'],
              auditTrail: []
            },
            customFields: {
              sessionId: event.sessionId,
              recordingType: 'compliance',
              autoGenerated: true
            }
          }).catch(error => {
            console.error('Failed to add recording start to timeline:', error);
          });
        }
      });

      this.recordingService.on('recordingStopped', (event) => {
        // Update timeline with recording completion
        if (this.timelineService) {
          this.timelineService.addTimelineEntry({
            communicationId: event.recordingId,
            tenantId: 'system', // Would need tenant ID
            clientId: 'system',
            employeeId: 'system',
            timestamp: new Date(),
            entryType: 'system_event',
            channel: 'system',
            direction: 'system',
            status: 'completed',
            priority: 'medium',
            subject: 'Recording Completed',
            summary: `Recording completed - Duration: ${Math.round(event.duration / 60)} minutes, Size: ${Math.round(event.fileSize / 1024 / 1024)} MB`,
            participants: [],
            attachments: [],
            tags: ['recording', 'compliance', 'completed'],
            categories: ['recording_event'],
            relatedEntries: [],
            metrics: {
              duration: event.duration
            },
            compliance: {
              recordingRequired: true,
              recordingExists: true,
              retentionPeriod: this.config.recording.defaultRetentionDays,
              complianceFlags: ['RECORDING_COMPLETED'],
              auditTrail: []
            },
            customFields: {
              recordingId: event.recordingId,
              fileSize: event.fileSize,
              duration: event.duration,
              autoGenerated: true
            }
          }).catch(error => {
            console.error('Failed to add recording completion to timeline:', error);
          });
        }
      });
    }

    // Timeline service events
    if (this.timelineService) {
      this.timelineService.on('alertCreated', (alert) => {
        // Analytics service could track timeline alerts
        if (this.analyticsService) {
          console.log(`Timeline alert created: ${alert.alertType} for client ${alert.clientId}`);
        }
      });
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Communication system is already initialized');
    }

    try {
      console.log('Initializing Communication System...');

      // Initialize services in order
      console.log('✓ Communication Service initialized');

      if (this.analyticsService) {
        console.log('✓ Analytics Service initialized');
      }

      if (this.recordingService) {
        console.log('✓ Recording Service initialized');
      }

      if (this.timelineService) {
        console.log('✓ Timeline Service initialized');
      }

      console.log('✓ API Controller initialized');
      console.log('✓ Service integrations configured');

      this.isInitialized = true;
      console.log('Communication System initialization complete');

    } catch (error) {
      console.error('Failed to initialize Communication System:', error);
      throw error;
    }
  }

  // Service getters
  getCommunicationService(): CommunicationService {
    return this.communicationService;
  }

  getAnalyticsService(): CommunicationAnalyticsService | undefined {
    return this.analyticsService;
  }

  getRecordingService(): ComplianceRecordingService | undefined {
    return this.recordingService;
  }

  getTimelineService(): CommunicationTimelineService | undefined {
    return this.timelineService;
  }

  getController(): CommunicationController {
    return this.controller;
  }

  getExpressApp() {
    return this.controller.getApp();
  }

  // Configuration methods
  getConfig(): CommunicationSystemConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<CommunicationSystemConfig>): void {
    if (this.isInitialized) {
      throw new Error('Cannot update configuration after initialization');
    }
    
    this.config = this.deepMerge(this.config, updates);
  }

  // Health and monitoring
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, 'available' | 'unavailable' | 'degraded'>;
    timestamp: Date;
    uptime: number;
  }> {
    const services = {
      communication: 'available' as const,
      analytics: this.analyticsService ? 'available' as const : 'unavailable' as const,
      recording: this.recordingService ? 'available' as const : 'unavailable' as const,
      timeline: this.timelineService ? 'available' as const : 'unavailable' as const
    };

    const unavailableCount = Object.values(services).filter(s => s === 'unavailable').length;
    const degradedCount = Object.values(services).filter(s => s === 'degraded').length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (degradedCount > 0 || unavailableCount === 1) {
      status = 'degraded';
    } else if (unavailableCount > 1) {
      status = 'unhealthy';
    }

    return {
      status,
      services,
      timestamp: new Date(),
      uptime: process.uptime()
    };
  }

  async getSystemMetrics(): Promise<{
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    uptime: number;
    services: {
      communication: any;
      analytics?: any;
      recording?: any;
      timeline?: any;
    };
  }> {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      services: {
        communication: {
          // Mock metrics - replace with actual service metrics
          totalCommunications: 0,
          averageResponseTime: 0
        },
        analytics: this.analyticsService ? {
          metricsProcessed: 0,
          alertsGenerated: 0
        } : undefined,
        recording: this.recordingService ? {
          activeRecordings: 0,
          totalRecordings: 0
        } : undefined,
        timeline: this.timelineService ? {
          totalEntries: 0,
          activeViews: 0
        } : undefined
      }
    };
  }

  // Lifecycle management
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    console.log('Shutting down Communication System...');

    try {
      // Graceful shutdown in reverse order
      await this.controller.shutdown();
      console.log('✓ API Controller shutdown complete');

      if (this.timelineService) {
        await this.timelineService.shutdown();
        console.log('✓ Timeline Service shutdown complete');
      }

      if (this.recordingService) {
        await this.recordingService.shutdown();
        console.log('✓ Recording Service shutdown complete');
      }

      if (this.analyticsService) {
        await this.analyticsService.shutdown();
        console.log('✓ Analytics Service shutdown complete');
      }

      // Communication service shutdown would go here
      console.log('✓ Communication Service shutdown complete');

      this.isInitialized = false;
      console.log('Communication System shutdown complete');

    } catch (error) {
      console.error('Error during Communication System shutdown:', error);
      throw error;
    }
  }
}

// Export all services and types
export {
  CommunicationService,
  CommunicationAnalyticsService,
  ComplianceRecordingService,
  CommunicationTimelineService,
  CommunicationController
};

// Export types
export * from './CommunicationService';
export * from './CommunicationAnalyticsService';
export * from './ComplianceRecordingService';
export * from './CommunicationTimelineService';
export * from './CommunicationController';

// Default export
export default CommunicationSystem;
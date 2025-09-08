import dotenv from 'dotenv';
import { AutoScalingService } from './AutoScalingService';
import { AutoScalingServiceConfig, FinancialServicesScalingProfile } from './types';

// Load environment variables
dotenv.config();

const config: AutoScalingServiceConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  metrics: {
    prometheusUrl: process.env.PROMETHEUS_URL,
    customEndpoints: (process.env.CUSTOM_METRIC_ENDPOINTS || '').split(',').filter(Boolean),
    collectionInterval: parseInt(process.env.METRICS_COLLECTION_INTERVAL || '30'), // seconds
  },
  scaling: {
    enabled: process.env.AUTO_SCALING_ENABLED !== 'false',
    provider: (process.env.SCALING_PROVIDER as any) || 'kubernetes',
    metrics: {
      sources: [
        {
          name: 'cpu_usage',
          type: 'prometheus',
          query: 'avg(cpu_usage_percent)',
          threshold: parseFloat(process.env.CPU_THRESHOLD || '70'),
          comparison: 'greater_than',
          weight: 0.4,
        },
        {
          name: 'memory_usage',
          type: 'prometheus',
          query: 'avg(memory_usage_percent)',
          threshold: parseFloat(process.env.MEMORY_THRESHOLD || '80'),
          comparison: 'greater_than',
          weight: 0.3,
        },
        {
          name: 'response_time',
          type: 'prometheus',
          query: 'avg(http_request_duration_seconds)',
          threshold: parseFloat(process.env.RESPONSE_TIME_THRESHOLD || '1'),
          comparison: 'greater_than',
          weight: 0.3,
        },
      ],
      aggregationWindow: parseInt(process.env.METRICS_AGGREGATION_WINDOW || '300'), // 5 minutes
      evaluationInterval: parseInt(process.env.SCALING_EVALUATION_INTERVAL || '60'), // 1 minute
    },
    rules: [
      {
        id: 'high-cpu-scale-up',
        name: 'High CPU Scale Up',
        description: 'Scale up when CPU usage is consistently high',
        enabled: true,
        conditions: [
          {
            metric: 'cpu.usage',
            operator: 'and',
            threshold: parseFloat(process.env.CPU_SCALE_UP_THRESHOLD || '75'),
            comparison: 'greater_than',
            duration: parseInt(process.env.CPU_SCALE_UP_DURATION || '300'), // 5 minutes
          },
        ],
        action: {
          type: 'scale_up',
          scaleByPercent: parseInt(process.env.SCALE_UP_PERCENT || '50'), // 50% increase
          targetServices: [], // Will be populated from monitored services
          gracefulShutdown: true,
        },
        priority: 1,
        tags: ['cpu', 'scale-up'],
      },
      {
        id: 'high-memory-scale-up',
        name: 'High Memory Scale Up',
        description: 'Scale up when memory usage is consistently high',
        enabled: true,
        conditions: [
          {
            metric: 'memory.usage',
            operator: 'and',
            threshold: parseFloat(process.env.MEMORY_SCALE_UP_THRESHOLD || '85'),
            comparison: 'greater_than',
            duration: parseInt(process.env.MEMORY_SCALE_UP_DURATION || '300'),
          },
        ],
        action: {
          type: 'scale_up',
          scaleByPercent: parseInt(process.env.SCALE_UP_PERCENT || '50'),
          targetServices: [],
          gracefulShutdown: true,
        },
        priority: 2,
        tags: ['memory', 'scale-up'],
      },
      {
        id: 'low-utilization-scale-down',
        name: 'Low Utilization Scale Down',
        description: 'Scale down when resource utilization is consistently low',
        enabled: true,
        conditions: [
          {
            metric: 'cpu.usage',
            operator: 'and',
            threshold: parseFloat(process.env.CPU_SCALE_DOWN_THRESHOLD || '30'),
            comparison: 'less_than',
            duration: parseInt(process.env.CPU_SCALE_DOWN_DURATION || '600'), // 10 minutes
          },
          {
            metric: 'memory.usage',
            operator: 'and',
            threshold: parseFloat(process.env.MEMORY_SCALE_DOWN_THRESHOLD || '40'),
            comparison: 'less_than',
            duration: parseInt(process.env.MEMORY_SCALE_DOWN_DURATION || '600'),
          },
        ],
        action: {
          type: 'scale_down',
          scaleByPercent: parseInt(process.env.SCALE_DOWN_PERCENT || '25'), // 25% decrease
          targetServices: [],
          gracefulShutdown: true,
        },
        priority: 3,
        tags: ['utilization', 'scale-down'],
      },
      {
        id: 'response-time-scale-up',
        name: 'Response Time Scale Up',
        description: 'Scale up when response times are degrading',
        enabled: true,
        conditions: [
          {
            metric: 'performance.responseTime',
            operator: 'and',
            threshold: parseFloat(process.env.RESPONSE_TIME_SCALE_UP_THRESHOLD || '2000'), // 2 seconds
            comparison: 'greater_than',
            duration: parseInt(process.env.RESPONSE_TIME_SCALE_UP_DURATION || '180'), // 3 minutes
          },
        ],
        action: {
          type: 'scale_up',
          scaleByCount: parseInt(process.env.RESPONSE_TIME_SCALE_UP_COUNT || '2'),
          targetServices: [],
          gracefulShutdown: true,
        },
        priority: 1,
        tags: ['performance', 'response-time', 'scale-up'],
      },
      {
        id: 'error-rate-scale-up',
        name: 'Error Rate Scale Up',
        description: 'Scale up when error rates are high',
        enabled: true,
        conditions: [
          {
            metric: 'performance.errorRate',
            operator: 'and',
            threshold: parseFloat(process.env.ERROR_RATE_THRESHOLD || '5'), // 5%
            comparison: 'greater_than',
            duration: parseInt(process.env.ERROR_RATE_DURATION || '120'), // 2 minutes
          },
        ],
        action: {
          type: 'scale_up',
          scaleByCount: parseInt(process.env.ERROR_RATE_SCALE_UP_COUNT || '3'),
          targetServices: [],
          gracefulShutdown: true,
        },
        priority: 1,
        tags: ['performance', 'error-rate', 'scale-up'],
      },
    ],
    limits: {
      minInstances: parseInt(process.env.MIN_INSTANCES || '2'),
      maxInstances: parseInt(process.env.MAX_INSTANCES || '20'),
      scaleUpCooldown: parseInt(process.env.SCALE_UP_COOLDOWN || '300'), // 5 minutes
      scaleDownCooldown: parseInt(process.env.SCALE_DOWN_COOLDOWN || '600'), // 10 minutes
    },
    notifications: {
      enabled: process.env.NOTIFICATIONS_ENABLED === 'true',
      webhookUrl: process.env.NOTIFICATION_WEBHOOK_URL,
      slackChannel: process.env.SLACK_CHANNEL,
    },
  },
  reporting: {
    enabled: process.env.REPORTING_ENABLED === 'true',
    schedule: process.env.REPORTING_SCHEDULE || '0 8 * * *', // Daily at 8 AM
    retentionDays: parseInt(process.env.REPORT_RETENTION_DAYS || '90'),
  },
  alerts: {
    enabled: process.env.ALERTS_ENABLED === 'true',
    webhookUrl: process.env.ALERT_WEBHOOK_URL,
    slackChannel: process.env.ALERT_SLACK_CHANNEL,
    emailRecipients: (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
  },
};

// Financial services specific scaling profile
const financialProfile: FinancialServicesScalingProfile = {
  marketHours: {
    preMarket: { start: '04:00', end: '09:30' },
    regular: { start: '09:30', end: '16:00' },
    afterMarket: { start: '16:00', end: '20:00' },
    timezone: process.env.MARKET_TIMEZONE || 'America/New_York',
  },
  tradingPatterns: {
    openingBell: { multiplier: 2.0, duration: 30 }, // 2x load for 30 minutes at open
    closingBell: { multiplier: 1.8, duration: 30 }, // 1.8x load for 30 minutes at close
    lunchTime: { multiplier: 0.7, duration: 60 }, // 30% less load during lunch
    monthEnd: { multiplier: 1.5, days: 3 }, // 50% more load for last 3 days of month
    quarterEnd: { multiplier: 2.5, days: 3 }, // 2.5x load for quarter end
  },
  complianceRequirements: {
    minInstancesForRedundancy: parseInt(process.env.MIN_REDUNDANCY_INSTANCES || '3'),
    maxScaleDownRate: parseFloat(process.env.MAX_SCALE_DOWN_RATE || '25'), // Max 25% per hour
    requiredApprovalForLargeScale: parseInt(process.env.LARGE_SCALE_APPROVAL_THRESHOLD || '10'),
    auditLogging: true,
  },
  riskManagement: {
    maxInstancesPerAvailabilityZone: parseInt(process.env.MAX_INSTANCES_PER_AZ || '10'),
    requiredHealthCheckGracePeriod: parseInt(process.env.HEALTH_CHECK_GRACE_PERIOD || '60'), // seconds
    automaticRollbackOnErrors: process.env.AUTO_ROLLBACK_ON_ERRORS !== 'false',
    catastrophicFailureThreshold: parseFloat(process.env.CATASTROPHIC_FAILURE_THRESHOLD || '50'), // 50% error rate
  },
};

// Update scaling rules with monitored services
const monitoredServices = (process.env.MONITORED_SERVICES || 'portfolio-service,market-data,auth,trading').split(',');
config.scaling.rules.forEach(rule => {
  rule.action.targetServices = monitoredServices;
});

const autoScalingService = new AutoScalingService(config, financialProfile);

// Event handlers
autoScalingService.on('serviceStarted', ({ port }) => {
  console.log(`Auto-Scaling Service started on port ${port}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/v1/health - Health check');
  console.log('  GET  /api/v1/status - Current scaling status');
  console.log('  GET  /api/v1/metrics/:serviceName - Service metrics');
  console.log('  GET  /api/v1/decisions/:serviceName - Scaling decisions');
  console.log('  GET  /api/v1/events/:serviceName - Scaling events');
  console.log('  POST /api/v1/scale/:serviceName - Manual scaling');
  console.log('  POST /api/v1/emergency/scale-down/:serviceName - Emergency scale-down');
  console.log('  POST /api/v1/rollback/:serviceName - Rollback scaling');
  console.log('  GET  /api/v1/predictions/:serviceName - Scaling predictions');
  console.log('  POST /api/v1/reports/generate - Generate scaling report');
  console.log('');
  console.log(`Monitoring ${monitoredServices.length} services: ${monitoredServices.join(', ')}`);
  console.log(`Financial profile enabled: Market hours ${financialProfile.marketHours.regular.start}-${financialProfile.marketHours.regular.end} ${financialProfile.marketHours.timezone}`);
});

autoScalingService.on('scalingExecuted', ({ serviceName, event }) => {
  console.log(`Scaling executed for ${serviceName}:`);
  console.log(`  Event ID: ${event.id}`);
  console.log(`  Action: ${event.action.type}`);
  console.log(`  Instances: ${event.previousInstances} -> ${event.newInstances}`);
  console.log(`  Duration: ${event.duration}ms`);
  console.log(`  Success: ${event.success}`);
  if (event.error) {
    console.log(`  Error: ${event.error}`);
  }
});

autoScalingService.on('scalingFailed', ({ id, error }) => {
  console.error(`Scaling failed: ${id} - ${error}`);
});

autoScalingService.on('reportGenerated', (report) => {
  console.log(`Scaling report generated: ${report.id}`);
  console.log(`  Period: ${report.period.start.toISOString()} to ${report.period.end.toISOString()}`);
  console.log(`  Total events: ${report.summary.totalScalingEvents}`);
  console.log(`  Success rate: ${((report.summary.successfulScalings / report.summary.totalScalingEvents) * 100).toFixed(1)}%`);
});

autoScalingService.on('error', (error) => {
  console.error('Auto-Scaling Service error:', error);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await autoScalingService.stop();
    console.log('Shutdown completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('unhandledRejection');
});

// Start the service
const port = parseInt(process.env.PORT || '3011');
autoScalingService.start(port);

export { AutoScalingService, config, financialProfile };

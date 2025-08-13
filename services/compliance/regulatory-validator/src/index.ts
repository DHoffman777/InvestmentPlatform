import dotenv from 'dotenv';
import { RegulatoryValidatorService } from './RegulatoryValidatorService';
import { RegulatoryValidatorConfig } from './types';

// Load environment variables
dotenv.config();

const config: RegulatoryValidatorConfig = {
  service: {
    port: parseInt(process.env.PORT || '3012'),
    host: process.env.HOST || 'localhost',
    environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
  },
  database: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '2'), // Use different DB from other services
    },
  },
  frameworks: {
    autoSync: process.env.FRAMEWORK_AUTO_SYNC === 'true',
    syncInterval: process.env.FRAMEWORK_SYNC_INTERVAL || '0 2 * * *', // Daily at 2 AM
    sources: {
      sec: {
        enabled: process.env.SEC_ENABLED === 'true',
        apiKey: process.env.SEC_API_KEY,
        baseUrl: process.env.SEC_BASE_URL || 'https://www.sec.gov/data',
      },
      finra: {
        enabled: process.env.FINRA_ENABLED === 'true',
        baseUrl: process.env.FINRA_BASE_URL || 'https://api.finra.org',
      },
      cftc: {
        enabled: process.env.CFTC_ENABLED === 'true',
        baseUrl: process.env.CFTC_BASE_URL || 'https://publicreporting.cftc.gov/api',
      },
      gdpr: {
        enabled: process.env.GDPR_ENABLED === 'true',
        version: process.env.GDPR_VERSION || '2018',
      },
    },
  },
  notifications: {
    email: {
      enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      username: process.env.SMTP_USERNAME,
      password: process.env.SMTP_PASSWORD,
    },
    webhook: {
      enabled: process.env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true',
      endpoints: (process.env.WEBHOOK_ENDPOINTS || '').split(',').filter(Boolean),
    },
    slack: {
      enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === 'true',
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },
  },
  audit: {
    enabled: process.env.AUDIT_ENABLED !== 'false', // Default to enabled
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555'), // 7 years default
    compressionEnabled: process.env.AUDIT_COMPRESSION_ENABLED === 'true',
  },
  reporting: {
    enabled: process.env.REPORTING_ENABLED === 'true',
    schedule: process.env.REPORTING_SCHEDULE || '0 8 * * *', // Daily at 8 AM
    formats: ['HTML', 'JSON', 'PDF', 'EXCEL'],
    distributionLists: {
      daily: (process.env.DAILY_REPORT_RECIPIENTS || '').split(',').filter(Boolean),
      weekly: (process.env.WEEKLY_REPORT_RECIPIENTS || '').split(',').filter(Boolean),
      monthly: (process.env.MONTHLY_REPORT_RECIPIENTS || '').split(',').filter(Boolean),
      quarterly: (process.env.QUARTERLY_REPORT_RECIPIENTS || '').split(',').filter(Boolean),
    },
  },
  performance: {
    cacheEnabled: process.env.CACHE_ENABLED !== 'false', // Default to enabled
    cacheTtl: parseInt(process.env.CACHE_TTL || '3600'), // 1 hour default
    batchSize: parseInt(process.env.BATCH_SIZE || '20'),
    maxConcurrentValidations: parseInt(process.env.MAX_CONCURRENT_VALIDATIONS || '50'),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'), // 30 seconds
  },
};

const regulatoryValidatorService = new RegulatoryValidatorService(config);

// Event handlers
regulatoryValidatorService.on('serviceStarted', ({ port }) => {
  console.log(`Regulatory Validator Service started on port ${port}`);
  console.log('Available endpoints:');
  console.log('  GET    /api/v1/health - Health check');
  console.log('  POST   /api/v1/validate - Validate entity compliance');
  console.log('  POST   /api/v1/validate/batch - Batch validation');
  console.log('  GET    /api/v1/validation/:requestId - Get validation result');
  console.log('  GET    /api/v1/rules - List all rules');
  console.log('  GET    /api/v1/rules/:ruleId - Get specific rule');
  console.log('  POST   /api/v1/rules - Create new rule');
  console.log('  PUT    /api/v1/rules/:ruleId - Update rule');
  console.log('  DELETE /api/v1/rules/:ruleId - Delete rule');
  console.log('  POST   /api/v1/rules/:ruleId/enable - Enable rule');
  console.log('  POST   /api/v1/rules/:ruleId/disable - Disable rule');
  console.log('  POST   /api/v1/exceptions - Create compliance exception');
  console.log('  GET    /api/v1/exceptions - List exceptions');
  console.log('  PUT    /api/v1/exceptions/:exceptionId - Update exception');
  console.log('  GET    /api/v1/alerts - List alerts');
  console.log('  PUT    /api/v1/alerts/:alertId - Update alert');
  console.log('  POST   /api/v1/reports/generate - Generate compliance report');
  console.log('  POST   /api/v1/reports/:reportId/export - Export report');
  console.log('  GET    /api/v1/audit - Get audit trail');
  console.log('  GET    /api/v1/metrics - Get compliance metrics');
  console.log('  POST   /api/v1/frameworks/sync - Sync regulatory frameworks');
  console.log('');
  console.log(`Environment: ${config.service.environment}`);
  console.log(`Audit enabled: ${config.audit.enabled}`);
  console.log(`Reporting enabled: ${config.reporting.enabled}`);
  console.log(`Cache enabled: ${config.performance.cacheEnabled}`);
  console.log(`Framework auto-sync: ${config.frameworks.autoSync}`);
  console.log('');
  console.log('Supported regulatory frameworks:');
  console.log('  - SEC (Securities and Exchange Commission)');
  console.log('  - FINRA (Financial Industry Regulatory Authority)');
  console.log('  - CFTC (Commodity Futures Trading Commission)');
  console.log('  - GDPR (General Data Protection Regulation)');
  console.log('  - CCPA (California Consumer Privacy Act)');
  console.log('  - MiFID II (Markets in Financial Instruments Directive)');
  console.log('  - FATCA (Foreign Account Tax Compliance Act)');
  console.log('  - CRS (Common Reporting Standard)');
});

regulatoryValidatorService.on('validationCompleted', (result) => {
  console.log(`Validation completed: ${result.requestId} - ${result.overallStatus}`);
  
  if (result.summary.criticalViolations > 0) {
    console.log(`⚠️  CRITICAL: ${result.summary.criticalViolations} critical violations found for ${result.entityType}:${result.entityId}`);
  }
  
  if (result.summary.failedRules > 0) {
    console.log(`⚠️  WARNING: ${result.summary.failedRules} rule failures for ${result.entityType}:${result.entityId}`);
  }
});

regulatoryValidatorService.on('alertCreated', (alert) => {
  const icon = alert.severity === 'CRITICAL' ? '🚨' : 
               alert.severity === 'HIGH' ? '⚠️' : 
               alert.severity === 'MEDIUM' ? '⚡' : 'ℹ️';
  
  console.log(`${icon} Alert created: ${alert.title} (${alert.severity})`);
  
  if (alert.severity === 'CRITICAL') {
    console.log(`🚨 CRITICAL ALERT: ${alert.message}`);
    console.log(`Entity: ${alert.entityType}:${alert.entityId}`);
    console.log(`Rule: ${alert.ruleId}`);
  }
});

regulatoryValidatorService.on('exceptionCreated', (exception) => {
  console.log(`Exception created: ${exception.id} for ${exception.entityType}:${exception.entityId}`);
  console.log(`Rule: ${exception.ruleId} | Type: ${exception.exceptionType} | Approved by: ${exception.approvedBy}`);
});

regulatoryValidatorService.on('reportGenerated', (report) => {
  console.log(`📊 Report generated: ${report.title} (${report.id})`);
  console.log(`Type: ${report.reportType} | Period: ${report.period.startDate.toISOString().split('T')[0]} to ${report.period.endDate.toISOString().split('T')[0]}`);
  console.log(`Overall compliance rate: ${report.summary.overallComplianceRate}%`);
  
  if (report.summary.criticalViolations > 0) {
    console.log(`⚠️  Critical violations: ${report.summary.criticalViolations}`);
  }
});

regulatoryValidatorService.on('scheduledReportGenerated', (report) => {
  console.log(`📅 Scheduled report generated: ${report.title} (${report.id})`);
  console.log(`Compliance rate: ${report.summary.overallComplianceRate}%`);
});

regulatoryValidatorService.on('ruleAdded', (data) => {
  console.log(`✅ Rule added: ${data.ruleId} (${data.category})`);
});

regulatoryValidatorService.on('ruleUpdated', (data) => {
  console.log(`🔄 Rule updated: ${data.ruleId}`);
});

regulatoryValidatorService.on('batchValidationCompleted', ({ request, result }) => {
  console.log(`Batch validation completed: ${request.requestId} - ${result.overallStatus}`);
});

regulatoryValidatorService.on('batchValidationFailed', ({ request, error }) => {
  console.error(`Batch validation failed: ${request.requestId} - ${error.message}`);
});

regulatoryValidatorService.on('error', (error) => {
  console.error('Regulatory Validator Service error:', error);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await regulatoryValidatorService.stop();
    console.log('Shutdown completed successfully');
    process.exit(0);
  } catch (error) {
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

// Display startup information
console.log('🏛️  Investment Management Platform - Regulatory Validator Service');
console.log('=====================================================================');
console.log('');
console.log('🔒 Compliance Features:');
console.log('  ✓ Multi-jurisdiction regulatory rule engine');
console.log('  ✓ Real-time compliance validation');
console.log('  ✓ Comprehensive audit trail');
console.log('  ✓ Exception management system');
console.log('  ✓ Automated compliance reporting');
console.log('  ✓ Risk assessment and analytics');
console.log('  ✓ Regulatory framework synchronization');
console.log('  ✓ Alert and notification system');
console.log('');
console.log('🌐 Supported Jurisdictions:');
console.log('  • United States (SEC, FINRA, CFTC, FATCA)');
console.log('  • European Union (GDPR, MiFID II)');
console.log('  • Global (CRS, Basel III)');
console.log('  • Extensible for additional jurisdictions');
console.log('');
console.log('📊 Analytics & Reporting:');
console.log('  • Real-time compliance dashboards');
console.log('  • Automated scheduled reports');
console.log('  • Trend analysis and forecasting');
console.log('  • Risk assessment metrics');
console.log('  • Performance optimization insights');
console.log('');

// Start the service
const port = config.service.port;
regulatoryValidatorService.start(port);

export { RegulatoryValidatorService, config };
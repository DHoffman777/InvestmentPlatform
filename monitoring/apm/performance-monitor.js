const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const cluster = require('cluster');

/**
 * Investment Platform Application Performance Monitor (APM)
 * Comprehensive performance monitoring and observability for financial services
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      http: {
        requests: new Map(),
        responses: new Map(),
        errors: new Map(),
        latency: [],
        throughput: 0
      },
      database: {
        queries: new Map(),
        connections: 0,
        poolSize: 0,
        latency: [],
        errors: new Map()
      },
      system: {
        cpu: [],
        memory: [],
        disk: [],
        network: []
      },
      business: {
        trades: 0,
        portfolioUpdates: 0,
        userSessions: 0,
        apiCalls: new Map(),
        financialTransactions: 0
      },
      alerts: [],
      traces: new Map()
    };

    this.config = {
      collection: {
        interval: parseInt(process.env.APM_COLLECTION_INTERVAL) || 30000, // 30 seconds
        retention: parseInt(process.env.APM_RETENTION_HOURS) || 168, // 7 days
        batchSize: parseInt(process.env.APM_BATCH_SIZE) || 100
      },
      thresholds: {
        httpLatency: parseInt(process.env.APM_HTTP_LATENCY_THRESHOLD) || 2000, // 2 seconds
        dbLatency: parseInt(process.env.APM_DB_LATENCY_THRESHOLD) || 1000, // 1 second
        cpuUsage: parseFloat(process.env.APM_CPU_THRESHOLD) || 80, // 80%
        memoryUsage: parseFloat(process.env.APM_MEMORY_THRESHOLD) || 85, // 85%
        errorRate: parseFloat(process.env.APM_ERROR_RATE_THRESHOLD) || 5, // 5%
        diskUsage: parseFloat(process.env.APM_DISK_THRESHOLD) || 90 // 90%
      },
      sampling: {
        traces: parseFloat(process.env.APM_TRACE_SAMPLING) || 0.1, // 10%
        slowQueries: parseInt(process.env.APM_SLOW_QUERY_THRESHOLD) || 1000 // 1 second
      },
      integrations: {
        prometheus: process.env.APM_PROMETHEUS_ENABLED === 'true',
        grafana: process.env.APM_GRAFANA_ENABLED === 'true',
        datadog: process.env.APM_DATADOG_ENABLED === 'true',
        newrelic: process.env.APM_NEWRELIC_ENABLED === 'true'
      }
    };

    this.startTime = Date.now();
    this.collectionTimer = null;
    this.isCollecting = false;
    
    this.initializeMonitoring();
  }

  // Initialize monitoring systems
  initializeMonitoring() {
    console.log('🔍 Initializing Application Performance Monitor...');
    
    // Start system metrics collection
    this.startSystemMetricsCollection();
    
    // Initialize HTTP monitoring middleware
    this.initializeHttpMonitoring();
    
    // Initialize database monitoring
    this.initializeDatabaseMonitoring();
    
    // Start trace collection
    this.initializeTracing();
    
    // Setup alerting
    this.initializeAlerting();
    
    console.log('✅ APM initialized successfully');
  }

  // HTTP Request/Response monitoring middleware
  getHttpMonitoringMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const traceId = this.generateTraceId();
      
      // Add trace ID to request
      req.traceId = traceId;
      req.apmStartTime = startTime;
      
      // Override res.end to capture response metrics
      const originalEnd = res.end;
      res.end = (...args) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Record HTTP metrics
        this.recordHttpMetrics({
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          traceId,
          timestamp: endTime
        });
        
        // Record business metrics
        this.recordBusinessMetrics(req, res);
        
        originalEnd.apply(res, args);
      };
      
      next();
    };
  }

  // Record HTTP request metrics
  recordHttpMetrics(metrics) {
    const key = `${metrics.method}:${this.normalizeUrl(metrics.url)}`;
    
    // Update request counts
    this.metrics.http.requests.set(key, (this.metrics.http.requests.get(key) || 0) + 1);
    
    // Update response codes
    const statusKey = `${key}:${metrics.statusCode}`;
    this.metrics.http.responses.set(statusKey, (this.metrics.http.responses.get(statusKey) || 0) + 1);
    
    // Record latency
    this.metrics.http.latency.push({
      endpoint: key,
      duration: metrics.duration,
      timestamp: metrics.timestamp,
      traceId: metrics.traceId
    });
    
    // Check for errors
    if (metrics.statusCode >= 400) {
      const errorKey = `${key}:${metrics.statusCode}`;
      this.metrics.http.errors.set(errorKey, (this.metrics.http.errors.get(errorKey) || 0) + 1);
    }
    
    // Check thresholds
    if (metrics.duration > this.config.thresholds.httpLatency) {
      this.createAlert({
        type: 'http_latency',
        severity: metrics.duration > this.config.thresholds.httpLatency * 2 ? 'critical' : 'warning',
        message: `HTTP request latency exceeded threshold: ${metrics.duration}ms for ${key}`,
        endpoint: key,
        duration: metrics.duration,
        traceId: metrics.traceId,
        timestamp: metrics.timestamp
      });
    }
    
    // Maintain sliding window (keep last hour)
    const cutoff = Date.now() - (60 * 60 * 1000);
    this.metrics.http.latency = this.metrics.http.latency.filter(m => m.timestamp > cutoff);
  }

  // Record business-specific metrics
  recordBusinessMetrics(req, res) {
    const url = req.url.toLowerCase();
    
    // Trading operations
    if (url.includes('/api/trades') && req.method === 'POST' && res.statusCode < 400) {
      this.metrics.business.trades++;
    }
    
    // Portfolio updates
    if (url.includes('/api/portfolios') && (req.method === 'PUT' || req.method === 'PATCH') && res.statusCode < 400) {
      this.metrics.business.portfolioUpdates++;
    }
    
    // Financial transactions
    if (url.includes('/api/transactions') && req.method === 'POST' && res.statusCode < 400) {
      this.metrics.business.financialTransactions++;
    }
    
    // API endpoint usage
    const endpoint = this.normalizeUrl(req.url);
    const apiKey = `${req.method}:${endpoint}`;
    this.metrics.business.apiCalls.set(apiKey, (this.metrics.business.apiCalls.get(apiKey) || 0) + 1);
  }

  // Database monitoring integration
  initializeDatabaseMonitoring() {
    // This would integrate with your database client (Prisma, etc.)
    console.log('📊 Initializing database monitoring...');
    
    // Example: Prisma middleware for query monitoring
    // prisma.$use(async (params, next) => {
    //   const startTime = Date.now();
    //   const result = await next(params);
    //   const duration = Date.now() - startTime;
    //   
    //   this.recordDatabaseMetrics({
    //     model: params.model,
    //     action: params.action,
    //     duration,
    //     args: params.args
    //   });
    //   
    //   return result;
    // });
  }

  // Record database metrics
  recordDatabaseMetrics(metrics) {
    const key = `${metrics.model}:${metrics.action}`;
    
    // Update query counts
    this.metrics.database.queries.set(key, (this.metrics.database.queries.get(key) || 0) + 1);
    
    // Record latency
    this.metrics.database.latency.push({
      query: key,
      duration: metrics.duration,
      timestamp: Date.now()
    });
    
    // Check for slow queries
    if (metrics.duration > this.config.sampling.slowQueries) {
      this.createAlert({
        type: 'slow_query',
        severity: 'warning',
        message: `Slow database query detected: ${key} took ${metrics.duration}ms`,
        query: key,
        duration: metrics.duration,
        timestamp: Date.now()
      });
    }
    
    // Maintain sliding window
    const cutoff = Date.now() - (60 * 60 * 1000);
    this.metrics.database.latency = this.metrics.database.latency.filter(m => m.timestamp > cutoff);
  }

  // System metrics collection
  startSystemMetricsCollection() {
    console.log('🖥️ Starting system metrics collection...');
    
    this.collectionTimer = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.collection.interval);
  }

  // Collect system performance metrics
  async collectSystemMetrics() {
    if (this.isCollecting) return;
    this.isCollecting = true;
    
    try {
      const timestamp = Date.now();
      
      // CPU metrics
      const cpuUsage = await this.getCpuUsage();
      this.metrics.system.cpu.push({
        usage: cpuUsage,
        loadAverage: os.loadavg(),
        timestamp
      });
      
      // Memory metrics
      const memoryUsage = this.getMemoryUsage();
      this.metrics.system.memory.push({
        ...memoryUsage,
        timestamp
      });
      
      // Disk metrics
      const diskUsage = await this.getDiskUsage();
      this.metrics.system.disk.push({
        ...diskUsage,
        timestamp
      });
      
      // Network metrics
      const networkUsage = await this.getNetworkUsage();
      this.metrics.system.network.push({
        ...networkUsage,
        timestamp
      });
      
      // Check thresholds
      this.checkSystemThresholds({
        cpu: cpuUsage,
        memory: memoryUsage.usagePercent,
        disk: diskUsage.usagePercent
      });
      
      // Maintain sliding window
      this.maintainMetricsWindow();
      
    } catch (error) {
      console.error('Error collecting system metrics:', error.message);
    } finally {
      this.isCollecting = false;
    }
  }

  // Get CPU usage percentage
  async getCpuUsage() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const startUsage = process.cpuUsage();
      
      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const duration = Date.now() - startTime;
        const cpuPercent = (currentUsage.user + currentUsage.system) / (duration * 1000);
        resolve(Math.min(cpuPercent * 100, 100));
      }, 100);
    });
  }

  // Get memory usage metrics
  getMemoryUsage() {
    const processMemory = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem()
    };
    
    return {
      process: {
        rss: processMemory.rss,
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        external: processMemory.external
      },
      system: {
        total: systemMemory.total,
        free: systemMemory.free,
        used: systemMemory.total - systemMemory.free
      },
      usagePercent: ((systemMemory.total - systemMemory.free) / systemMemory.total) * 100
    };
  }

  // Get disk usage metrics
  async getDiskUsage() {
    try {
      const { execSync } = require('child_process');
      const output = execSync('df -h /', { encoding: 'utf8' });
      const lines = output.split('\n');
      const data = lines[1].split(/\s+/);
      
      return {
        total: data[1],
        used: data[2],
        free: data[3],
        usagePercent: parseInt(data[4])
      };
    } catch (error) {
      return { total: 'N/A', used: 'N/A', free: 'N/A', usagePercent: 0 };
    }
  }

  // Get network usage metrics
  async getNetworkUsage() {
    try {
      const { execSync } = require('child_process');
      const output = execSync('cat /proc/net/dev', { encoding: 'utf8' });
      const lines = output.split('\n');
      
      let totalRx = 0, totalTx = 0;
      for (const line of lines) {
        if (line.includes(':') && !line.includes('lo:')) {
          const parts = line.split(/\s+/);
          totalRx += parseInt(parts[1]) || 0;
          totalTx += parseInt(parts[9]) || 0;
        }
      }
      
      return { bytesReceived: totalRx, bytesTransmitted: totalTx };
    } catch (error) {
      return { bytesReceived: 0, bytesTransmitted: 0 };
    }
  }

  // Check system resource thresholds
  checkSystemThresholds(metrics) {
    if (metrics.cpu > this.config.thresholds.cpuUsage) {
      this.createAlert({
        type: 'high_cpu',
        severity: metrics.cpu > this.config.thresholds.cpuUsage * 1.2 ? 'critical' : 'warning',
        message: `High CPU usage detected: ${metrics.cpu.toFixed(2)}%`,
        value: metrics.cpu,
        threshold: this.config.thresholds.cpuUsage
      });
    }
    
    if (metrics.memory > this.config.thresholds.memoryUsage) {
      this.createAlert({
        type: 'high_memory',
        severity: metrics.memory > this.config.thresholds.memoryUsage * 1.1 ? 'critical' : 'warning',
        message: `High memory usage detected: ${metrics.memory.toFixed(2)}%`,
        value: metrics.memory,
        threshold: this.config.thresholds.memoryUsage
      });
    }
    
    if (metrics.disk > this.config.thresholds.diskUsage) {
      this.createAlert({
        type: 'high_disk',
        severity: 'critical',
        message: `High disk usage detected: ${metrics.disk}%`,
        value: metrics.disk,
        threshold: this.config.thresholds.diskUsage
      });
    }
  }

  // Initialize distributed tracing
  initializeTracing() {
    console.log('🔍 Initializing distributed tracing...');
    
    // Integration with OpenTelemetry would go here
    // const { NodeSDK } = require('@opentelemetry/sdk-node');
    // const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
  }

  // Generate trace ID
  generateTraceId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Initialize alerting system
  initializeAlerting() {
    console.log('🚨 Initializing alerting system...');
    
    // Setup alert processing
    setInterval(() => {
      this.processAlerts();
    }, 60000); // Process alerts every minute
  }

  // Create performance alert
  createAlert(alert) {
    const alertWithId = {
      ...alert,
      id: this.generateTraceId(),
      timestamp: alert.timestamp || Date.now(),
      resolved: false
    };
    
    this.metrics.alerts.push(alertWithId);
    
    // Immediate processing for critical alerts
    if (alert.severity === 'critical') {
      this.sendImmediateAlert(alertWithId);
    }
    
    // Maintain alert history
    if (this.metrics.alerts.length > 1000) {
      this.metrics.alerts = this.metrics.alerts.slice(-500);
    }
  }

  // Process and send alerts
  processAlerts() {
    const unresolvedAlerts = this.metrics.alerts.filter(alert => !alert.resolved);
    
    if (unresolvedAlerts.length === 0) return;
    
    // Group similar alerts
    const groupedAlerts = this.groupAlerts(unresolvedAlerts);
    
    // Send alert notifications
    for (const [type, alerts] of groupedAlerts) {
      this.sendAlertNotification(type, alerts);
    }
  }

  // Group similar alerts to prevent spam
  groupAlerts(alerts) {
    const grouped = new Map();
    
    for (const alert of alerts) {
      const key = `${alert.type}-${alert.severity}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(alert);
    }
    
    return grouped;
  }

  // Send immediate alert for critical issues
  async sendImmediateAlert(alert) {
    console.log(`🚨 CRITICAL ALERT: ${alert.message}`);
    
    // Integration with alerting services (PagerDuty, OpsGenie, etc.)
    // would be implemented here
  }

  // Send alert notification
  async sendAlertNotification(type, alerts) {
    console.log(`⚠️ Alert notification: ${type} (${alerts.length} alerts)`);
    
    // Mark alerts as processed
    alerts.forEach(alert => {
      alert.resolved = Date.now();
    });
  }

  // Maintain metrics sliding window
  maintainMetricsWindow() {
    const cutoff = Date.now() - (this.config.collection.retention * 60 * 60 * 1000);
    
    // Clean up old metrics
    this.metrics.system.cpu = this.metrics.system.cpu.filter(m => m.timestamp > cutoff);
    this.metrics.system.memory = this.metrics.system.memory.filter(m => m.timestamp > cutoff);
    this.metrics.system.disk = this.metrics.system.disk.filter(m => m.timestamp > cutoff);
    this.metrics.system.network = this.metrics.system.network.filter(m => m.timestamp > cutoff);
  }

  // Get current performance summary
  getPerformanceSummary() {
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);
    
    // Calculate recent HTTP metrics
    const recentLatency = this.metrics.http.latency.filter(m => m.timestamp > lastHour);
    const avgLatency = recentLatency.length > 0 
      ? recentLatency.reduce((sum, m) => sum + m.duration, 0) / recentLatency.length 
      : 0;
    
    // Calculate error rate
    const totalRequests = Array.from(this.metrics.http.requests.values()).reduce((sum, count) => sum + count, 0);
    const totalErrors = Array.from(this.metrics.http.errors.values()).reduce((sum, count) => sum + count, 0);
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    
    // Get latest system metrics
    const latestCpu = this.metrics.system.cpu[this.metrics.system.cpu.length - 1];
    const latestMemory = this.metrics.system.memory[this.metrics.system.memory.length - 1];
    
    return {
      timestamp: now,
      uptime: now - this.startTime,
      http: {
        totalRequests,
        totalErrors,
        errorRate: errorRate.toFixed(2),
        avgLatency: avgLatency.toFixed(2),
        throughput: this.calculateThroughput()
      },
      system: {
        cpu: latestCpu ? latestCpu.usage.toFixed(2) : 'N/A',
        memory: latestMemory ? latestMemory.usagePercent.toFixed(2) : 'N/A',
        loadAverage: latestCpu ? latestCpu.loadAverage : [0, 0, 0]
      },
      business: {
        trades: this.metrics.business.trades,
        portfolioUpdates: this.metrics.business.portfolioUpdates,
        financialTransactions: this.metrics.business.financialTransactions,
        activeSessions: this.metrics.business.userSessions
      },
      alerts: {
        total: this.metrics.alerts.length,
        unresolved: this.metrics.alerts.filter(a => !a.resolved).length,
        critical: this.metrics.alerts.filter(a => a.severity === 'critical' && !a.resolved).length
      }
    };
  }

  // Calculate request throughput (requests per minute)
  calculateThroughput() {
    const now = Date.now();
    const lastMinute = now - (60 * 1000);
    const recentRequests = this.metrics.http.latency.filter(m => m.timestamp > lastMinute);
    return recentRequests.length;
  }

  // Normalize URL for consistent metrics
  normalizeUrl(url) {
    // Remove query parameters and normalize path parameters
    return url
      .split('?')[0]
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]+/g, '/:uuid');
  }

  // Export metrics for external systems
  exportMetrics(format = 'json') {
    const summary = this.getPerformanceSummary();
    
    switch (format) {
      case 'prometheus':
        return this.exportPrometheusMetrics();
      case 'json':
      default:
        return JSON.stringify(summary, null, 2);
    }
  }

  // Export metrics in Prometheus format
  exportPrometheusMetrics() {
    let output = '';
    
    // HTTP metrics
    output += '# HELP http_requests_total Total number of HTTP requests\n';
    output += '# TYPE http_requests_total counter\n';
    for (const [endpoint, count] of this.metrics.http.requests) {
      const [method, path] = endpoint.split(':');
      output += `http_requests_total{method="${method}",path="${path}"} ${count}\n`;
    }
    
    // System metrics
    const latestCpu = this.metrics.system.cpu[this.metrics.system.cpu.length - 1];
    const latestMemory = this.metrics.system.memory[this.metrics.system.memory.length - 1];
    
    if (latestCpu) {
      output += '# HELP system_cpu_usage CPU usage percentage\n';
      output += '# TYPE system_cpu_usage gauge\n';
      output += `system_cpu_usage ${latestCpu.usage}\n`;
    }
    
    if (latestMemory) {
      output += '# HELP system_memory_usage Memory usage percentage\n';
      output += '# TYPE system_memory_usage gauge\n';
      output += `system_memory_usage ${latestMemory.usagePercent}\n`;
    }
    
    return output;
  }

  // Generate performance report
  async generateReport() {
    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    const summary = this.getPerformanceSummary();
    const reportFile = path.join(reportDir, `apm-report-${Date.now()}.json`);
    
    await fs.writeFile(reportFile, JSON.stringify({
      summary,
      detailedMetrics: {
        http: {
          requests: Object.fromEntries(this.metrics.http.requests),
          responses: Object.fromEntries(this.metrics.http.responses),
          errors: Object.fromEntries(this.metrics.http.errors),
          recentLatency: this.metrics.http.latency.slice(-100)
        },
        database: {
          queries: Object.fromEntries(this.metrics.database.queries),
          recentLatency: this.metrics.database.latency.slice(-100)
        },
        system: {
          cpu: this.metrics.system.cpu.slice(-100),
          memory: this.metrics.system.memory.slice(-100)
        },
        business: this.metrics.business,
        alerts: this.metrics.alerts.slice(-50)
      }
    }, null, 2));
    
    console.log(`📊 Performance report generated: ${reportFile}`);
    return reportFile;
  }

  // Shutdown cleanup
  shutdown() {
    console.log('🔄 Shutting down APM...');
    
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
    }
    
    // Export final metrics
    this.generateReport();
    
    console.log('✅ APM shutdown complete');
  }
}

// Singleton instance
let apmInstance = null;

// Initialize APM
function initializeAPM(config = {}) {
  if (!apmInstance) {
    apmInstance = new PerformanceMonitor();
  }
  return apmInstance;
}

// Get APM instance
function getAPM() {
  return apmInstance;
}

module.exports = {
  PerformanceMonitor,
  initializeAPM,
  getAPM
};
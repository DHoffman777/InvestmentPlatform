const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

/**
 * Investment Platform Infrastructure Monitor
 * Comprehensive infrastructure monitoring and alerting system
 */
class InfrastructureMonitor {
  constructor() {
    this.services = new Map();
    this.metrics = {
      kubernetes: {
        nodes: [],
        pods: [],
        services: [],
        deployments: [],
        resources: []
      },
      docker: {
        containers: [],
        images: [],
        volumes: [],
        networks: []
      },
      database: {
        connections: [],
        replication: [],
        performance: [],
        backups: []
      },
      redis: {
        memory: [],
        connections: [],
        commands: [],
        replication: []
      },
      messageQueue: {
        queues: [],
        messages: [],
        consumers: [],
        errors: []
      },
      loadBalancer: {
        backends: [],
        health: [],
        traffic: []
      },
      storage: {
        volumes: [],
        usage: [],
        performance: []
      },
      network: {
        connectivity: [],
        latency: [],
        bandwidth: []
      }
    };

    this.config = {
      monitoring: {
        interval: parseInt(process.env.INFRA_MONITOR_INTERVAL) || 60000, // 1 minute
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
        retention: parseInt(process.env.INFRA_RETENTION_HOURS) || 168 // 7 days
      },
      thresholds: {
        nodeMemory: parseFloat(process.env.NODE_MEMORY_THRESHOLD) || 85, // 85%
        nodeCpu: parseFloat(process.env.NODE_CPU_THRESHOLD) || 80, // 80%
        podRestarts: parseInt(process.env.POD_RESTART_THRESHOLD) || 5,
        diskUsage: parseFloat(process.env.DISK_USAGE_THRESHOLD) || 90, // 90%
        dbConnections: parseInt(process.env.DB_CONNECTION_THRESHOLD) || 80, // 80% of max
        redisMemory: parseFloat(process.env.REDIS_MEMORY_THRESHOLD) || 90, // 90%
        queueDepth: parseInt(process.env.QUEUE_DEPTH_THRESHOLD) || 1000
      },
      kubernetes: {
        enabled: process.env.KUBERNETES_ENABLED === 'true',
        namespace: process.env.KUBERNETES_NAMESPACE || 'investment-platform',
        configPath: process.env.KUBECONFIG || path.join(process.env.HOME, '.kube/config')
      },
      docker: {
        enabled: process.env.DOCKER_ENABLED === 'true',
        socket: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
      },
      alerting: {
        webhooks: process.env.ALERT_WEBHOOKS?.split(',') || [],
        email: {
          enabled: process.env.EMAIL_ALERTS_ENABLED === 'true',
          recipients: process.env.ALERT_RECIPIENTS?.split(',') || []
        },
        pagerduty: {
          enabled: process.env.PAGERDUTY_ENABLED === 'true',
          integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY
        }
      }
    };

    this.alerts = [];
    this.healthChecks = new Map();
    this.monitoringTimer = null;
    this.healthCheckTimer = null;

    this.initializeMonitoring();
  }

  // Initialize infrastructure monitoring
  initializeMonitoring() {
    console.log('🏗️ Initializing Infrastructure Monitor...');
    
    // Register core services
    this.registerCoreServices();
    
    // Start monitoring loops
    this.startMonitoring();
    
    // Initialize health checks
    this.initializeHealthChecks();
    
    console.log('✅ Infrastructure monitoring initialized');
  }

  // Register core platform services
  registerCoreServices() {
    const coreServices = [
      {
        name: 'api-gateway',
        type: 'http',
        url: process.env.API_GATEWAY_URL || 'http://localhost:8080/health',
        critical: true
      },
      {
        name: 'user-service',
        type: 'http',
        url: process.env.USER_SERVICE_URL || 'http://localhost:3001/health',
        critical: true
      },
      {
        name: 'portfolio-service',
        type: 'http',
        url: process.env.PORTFOLIO_SERVICE_URL || 'http://localhost:3002/health',
        critical: true
      },
      {
        name: 'market-data-service',
        type: 'http',
        url: process.env.MARKET_DATA_SERVICE_URL || 'http://localhost:3003/health',
        critical: true
      },
      {
        name: 'postgres-primary',
        type: 'database',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        critical: true
      },
      {
        name: 'redis-cache',
        type: 'redis',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        critical: false
      },
      {
        name: 'kafka-broker',
        type: 'kafka',
        host: process.env.KAFKA_HOST || 'localhost',
        port: parseInt(process.env.KAFKA_PORT) || 9092,
        critical: false
      }
    ];

    coreServices.forEach(service => {
      this.services.set(service.name, {
        ...service,
        status: 'unknown',
        lastCheck: null,
        consecutiveFailures: 0,
        uptime: 0,
        responseTime: null
      });
    });

    console.log(`📋 Registered ${coreServices.length} core services for monitoring`);
  }

  // Start monitoring loops
  startMonitoring() {
    console.log('🔄 Starting infrastructure monitoring loops...');
    
    // Main monitoring loop
    this.monitoringTimer = setInterval(() => {
      this.collectInfrastructureMetrics();
    }, this.config.monitoring.interval);
    
    // Health check loop
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.monitoring.healthCheckInterval);

    // Initial collection
    this.collectInfrastructureMetrics();
    this.performHealthChecks();
  }

  // Collect comprehensive infrastructure metrics
  async collectInfrastructureMetrics() {
    console.log('📊 Collecting infrastructure metrics...');
    
    try {
      await Promise.all([
        this.collectKubernetesMetrics(),
        this.collectDockerMetrics(),
        this.collectDatabaseMetrics(),
        this.collectRedisMetrics(),
        this.collectMessageQueueMetrics(),
        this.collectStorageMetrics(),
        this.collectNetworkMetrics()
      ]);
      
      // Check thresholds and generate alerts
      this.checkInfrastructureThresholds();
      
      // Clean up old metrics
      this.cleanupOldMetrics();
      
    } catch (error) {
      console.error('❌ Error collecting infrastructure metrics:', error.message);
      this.createAlert({
        type: 'monitoring_error',
        severity: 'warning',
        message: `Failed to collect infrastructure metrics: ${error.message}`,
        component: 'infrastructure-monitor'
      });
    }
  }

  // Collect Kubernetes metrics
  async collectKubernetesMetrics() {
    if (!this.config.kubernetes.enabled) return;
    
    try {
      console.log('  📦 Collecting Kubernetes metrics...');
      
      // Get nodes
      const nodesOutput = execSync('kubectl get nodes -o json', { encoding: 'utf8' });
      const nodes = JSON.parse(nodesOutput).items;
      
      const nodeMetrics = [];
      for (const node of nodes) {
        const nodeMetric = {
          name: node.metadata.name,
          status: this.getNodeStatus(node),
          capacity: node.status.capacity,
          allocatable: node.status.allocatable,
          conditions: node.status.conditions,
          timestamp: Date.now()
        };
        
        // Get resource usage
        try {
          const metricsOutput = execSync(`kubectl top node ${node.metadata.name} --no-headers`, { encoding: 'utf8' });
          const metrics = metricsOutput.trim().split(/\s+/);
          nodeMetric.cpuUsage = metrics[1];
          nodeMetric.memoryUsage = metrics[2];
        } catch (error) {
          console.log(`    ⚠️ Could not get metrics for node ${node.metadata.name}`);
        }
        
        nodeMetrics.push(nodeMetric);
      }
      
      this.metrics.kubernetes.nodes = nodeMetrics;
      
      // Get pods
      const podsOutput = execSync(`kubectl get pods -n ${this.config.kubernetes.namespace} -o json`, { encoding: 'utf8' });
      const pods = JSON.parse(podsOutput).items;
      
      const podMetrics = pods.map(pod => ({
        name: pod.metadata.name,
        namespace: pod.metadata.namespace,
        status: pod.status.phase,
        restartCount: pod.status.containerStatuses ? 
          pod.status.containerStatuses.reduce((sum, container) => sum + container.restartCount, 0) : 0,
        node: pod.spec.nodeName,
        createdAt: pod.metadata.creationTimestamp,
        timestamp: Date.now()
      }));
      
      this.metrics.kubernetes.pods = podMetrics;
      
      // Get services
      const servicesOutput = execSync(`kubectl get services -n ${this.config.kubernetes.namespace} -o json`, { encoding: 'utf8' });
      const services = JSON.parse(servicesOutput).items;
      
      this.metrics.kubernetes.services = services.map(service => ({
        name: service.metadata.name,
        type: service.spec.type,
        clusterIP: service.spec.clusterIP,
        ports: service.spec.ports,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.log('    ⚠️ Kubernetes metrics collection failed:', error.message);
    }
  }

  // Collect Docker metrics
  async collectDockerMetrics() {
    if (!this.config.docker.enabled) return;
    
    try {
      console.log('  🐳 Collecting Docker metrics...');
      
      // Get containers
      const containersOutput = execSync('docker ps -a --format "{{json .}}"', { encoding: 'utf8' });
      const containerLines = containersOutput.trim().split('\n').filter(line => line);
      
      const containerMetrics = containerLines.map(line => {
        const container = JSON.parse(line);
        return {
          id: container.ID,
          name: container.Names,
          image: container.Image,
          status: container.Status,
          state: container.State,
          ports: container.Ports,
          createdAt: container.CreatedAt,
          timestamp: Date.now()
        };
      });
      
      this.metrics.docker.containers = containerMetrics;
      
      // Get images
      const imagesOutput = execSync('docker images --format "{{json .}}"', { encoding: 'utf8' });
      const imageLines = imagesOutput.trim().split('\n').filter(line => line);
      
      this.metrics.docker.images = imageLines.map(line => {
        const image = JSON.parse(line);
        return {
          id: image.ID,
          repository: image.Repository,
          tag: image.Tag,
          size: image.Size,
          createdAt: image.CreatedAt,
          timestamp: Date.now()
        };
      });
      
    } catch (error) {
      console.log('    ⚠️ Docker metrics collection failed:', error.message);
    }
  }

  // Collect database metrics
  async collectDatabaseMetrics() {
    try {
      console.log('  🗃️ Collecting database metrics...');
      
      // This would integrate with your database monitoring
      // Example: PostgreSQL monitoring
      const dbMetrics = {
        connections: {
          active: 0,
          idle: 0,
          total: 0,
          maxConnections: 100
        },
        performance: {
          queryTime: 0,
          transactions: 0,
          commits: 0,
          rollbacks: 0
        },
        replication: {
          lag: 0,
          status: 'healthy'
        },
        timestamp: Date.now()
      };
      
      this.metrics.database.connections.push(dbMetrics);
      
    } catch (error) {
      console.log('    ⚠️ Database metrics collection failed:', error.message);
    }
  }

  // Collect Redis metrics
  async collectRedisMetrics() {
    try {
      console.log('  🔴 Collecting Redis metrics...');
      
      // This would integrate with Redis monitoring
      const redisMetrics = {
        memory: {
          used: 0,
          peak: 0,
          fragmentation: 0
        },
        connections: {
          clients: 0,
          blocked: 0
        },
        commands: {
          processed: 0,
          persec: 0
        },
        timestamp: Date.now()
      };
      
      this.metrics.redis.memory.push(redisMetrics);
      
    } catch (error) {
      console.log('    ⚠️ Redis metrics collection failed:', error.message);
    }
  }

  // Collect message queue metrics
  async collectMessageQueueMetrics() {
    try {
      console.log('  📨 Collecting message queue metrics...');
      
      // This would integrate with Kafka/RabbitMQ monitoring
      const queueMetrics = {
        queues: [
          {
            name: 'portfolio-updates',
            messages: 0,
            consumers: 1,
            rate: 0
          },
          {
            name: 'market-data',
            messages: 0,
            consumers: 2,
            rate: 0
          }
        ],
        timestamp: Date.now()
      };
      
      this.metrics.messageQueue.queues.push(queueMetrics);
      
    } catch (error) {
      console.log('    ⚠️ Message queue metrics collection failed:', error.message);
    }
  }

  // Collect storage metrics
  async collectStorageMetrics() {
    try {
      console.log('  💾 Collecting storage metrics...');
      
      const storageOutput = execSync('df -h', { encoding: 'utf8' });
      const lines = storageOutput.split('\n').slice(1).filter(line => line);
      
      const storageMetrics = lines.map(line => {
        const parts = line.split(/\s+/);
        return {
          filesystem: parts[0],
          size: parts[1],
          used: parts[2],
          available: parts[3],
          usePercent: parseInt(parts[4]) || 0,
          mountPoint: parts[5],
          timestamp: Date.now()
        };
      }).filter(metric => metric.filesystem && !metric.filesystem.startsWith('tmpfs'));
      
      this.metrics.storage.volumes = storageMetrics;
      
    } catch (error) {
      console.log('    ⚠️ Storage metrics collection failed:', error.message);
    }
  }

  // Collect network metrics
  async collectNetworkMetrics() {
    try {
      console.log('  🌐 Collecting network metrics...');
      
      // Test connectivity to external services
      const connectivityTests = [
        { name: 'external-api', url: 'https://api.example.com/health' },
        { name: 'market-data-provider', url: 'https://market-data.example.com/ping' }
      ];
      
      const connectivityResults = [];
      for (const test of connectivityTests) {
        try {
          const start = Date.now();
          await axios.get(test.url, { timeout: 5000 });
          connectivityResults.push({
            name: test.name,
            status: 'connected',
            latency: Date.now() - start,
            timestamp: Date.now()
          });
        } catch (error) {
          connectivityResults.push({
            name: test.name,
            status: 'failed',
            error: error.message,
            timestamp: Date.now()
          });
        }
      }
      
      this.metrics.network.connectivity = connectivityResults;
      
    } catch (error) {
      console.log('    ⚠️ Network metrics collection failed:', error.message);
    }
  }

  // Perform health checks on registered services
  async performHealthChecks() {
    console.log('🏥 Performing service health checks...');
    
    const healthCheckPromises = Array.from(this.services.entries()).map(
      ([serviceName, service]) => this.checkServiceHealth(serviceName, service)
    );
    
    await Promise.allSettled(healthCheckPromises);
  }

  // Check health of individual service
  async checkServiceHealth(serviceName, service) {
    const startTime = Date.now();
    
    try {
      let isHealthy = false;
      
      switch (service.type) {
        case 'http':
          isHealthy = await this.checkHttpHealth(service.url);
          break;
        case 'database':
          isHealthy = await this.checkDatabaseHealth(service.host, service.port);
          break;
        case 'redis':
          isHealthy = await this.checkRedisHealth(service.host, service.port);
          break;
        case 'kafka':
          isHealthy = await this.checkKafkaHealth(service.host, service.port);
          break;
        default:
          console.log(`    ⚠️ Unknown service type: ${service.type}`);
          return;
      }
      
      const responseTime = Date.now() - startTime;
      
      // Update service status
      service.status = isHealthy ? 'healthy' : 'unhealthy';
      service.lastCheck = Date.now();
      service.responseTime = responseTime;
      
      if (isHealthy) {
        service.consecutiveFailures = 0;
        service.uptime = (service.uptime || 0) + this.config.monitoring.healthCheckInterval;
      } else {
        service.consecutiveFailures++;
        
        // Create alert for service failure
        if (service.consecutiveFailures >= 3) {
          this.createAlert({
            type: 'service_down',
            severity: service.critical ? 'critical' : 'warning',
            message: `Service ${serviceName} has been unhealthy for ${service.consecutiveFailures} consecutive checks`,
            service: serviceName,
            responseTime
          });
        }
      }
      
      console.log(`    ${isHealthy ? '✅' : '❌'} ${serviceName}: ${service.status} (${responseTime}ms)`);
      
    } catch (error) {
      console.log(`    ❌ ${serviceName}: Health check error - ${error.message}`);
      service.status = 'error';
      service.consecutiveFailures++;
    }
  }

  // HTTP health check
  async checkHttpHealth(url) {
    try {
      const response = await axios.get(url, { 
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      return response.status < 400;
    } catch (error) {
      return false;
    }
  }

  // Database health check
  async checkDatabaseHealth(host, port) {
    // This would use actual database client
    // For now, just check if port is reachable
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      
      socket.setTimeout(5000);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
      
      socket.connect(port, host);
    });
  }

  // Redis health check
  async checkRedisHealth(host, port) {
    return this.checkDatabaseHealth(host, port);
  }

  // Kafka health check
  async checkKafkaHealth(host, port) {
    return this.checkDatabaseHealth(host, port);
  }

  // Check infrastructure thresholds and create alerts
  checkInfrastructureThresholds() {
    // Check Kubernetes node resources
    for (const node of this.metrics.kubernetes.nodes) {
      if (node.memoryUsage) {
        const memPercent = parseFloat(node.memoryUsage.replace('%', ''));
        if (memPercent > this.config.thresholds.nodeMemory) {
          this.createAlert({
            type: 'high_node_memory',
            severity: memPercent > this.config.thresholds.nodeMemory * 1.1 ? 'critical' : 'warning',
            message: `High memory usage on node ${node.name}: ${memPercent}%`,
            node: node.name,
            value: memPercent,
            threshold: this.config.thresholds.nodeMemory
          });
        }
      }
      
      if (node.cpuUsage) {
        const cpuPercent = parseFloat(node.cpuUsage.replace('%', ''));
        if (cpuPercent > this.config.thresholds.nodeCpu) {
          this.createAlert({
            type: 'high_node_cpu',
            severity: 'warning',
            message: `High CPU usage on node ${node.name}: ${cpuPercent}%`,
            node: node.name,
            value: cpuPercent,
            threshold: this.config.thresholds.nodeCpu
          });
        }
      }
    }
    
    // Check pod restart counts
    for (const pod of this.metrics.kubernetes.pods) {
      if (pod.restartCount > this.config.thresholds.podRestarts) {
        this.createAlert({
          type: 'high_pod_restarts',
          severity: 'warning',
          message: `Pod ${pod.name} has restarted ${pod.restartCount} times`,
          pod: pod.name,
          restartCount: pod.restartCount,
          threshold: this.config.thresholds.podRestarts
        });
      }
    }
    
    // Check storage usage
    for (const volume of this.metrics.storage.volumes) {
      if (volume.usePercent > this.config.thresholds.diskUsage) {
        this.createAlert({
          type: 'high_disk_usage',
          severity: 'critical',
          message: `High disk usage on ${volume.mountPoint}: ${volume.usePercent}%`,
          mountPoint: volume.mountPoint,
          value: volume.usePercent,
          threshold: this.config.thresholds.diskUsage
        });
      }
    }
  }

  // Create infrastructure alert
  createAlert(alert) {
    const alertWithId = {
      ...alert,
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      timestamp: Date.now(),
      resolved: false
    };
    
    this.alerts.push(alertWithId);
    
    // Send immediate notification for critical alerts
    if (alert.severity === 'critical') {
      this.sendImmediateAlert(alertWithId);
    }
    
    console.log(`🚨 ALERT: ${alert.message}`);
    
    // Maintain alert history
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }
  }

  // Send immediate alert
  async sendImmediateAlert(alert) {
    console.log(`🚨 CRITICAL INFRASTRUCTURE ALERT: ${alert.message}`);
    
    // Integration with alerting services would go here
    // PagerDuty, OpsGenie, email, Slack, etc.
  }

  // Get infrastructure status summary
  getInfrastructureStatus() {
    const services = Array.from(this.services.entries()).map(([name, service]) => ({
      name,
      status: service.status,
      responseTime: service.responseTime,
      consecutiveFailures: service.consecutiveFailures,
      uptime: service.uptime
    }));
    
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const totalServices = services.length;
    
    return {
      timestamp: Date.now(),
      overall: {
        status: healthyServices === totalServices ? 'healthy' : 
                healthyServices > totalServices * 0.8 ? 'degraded' : 'unhealthy',
        healthyServices,
        totalServices,
        healthPercentage: ((healthyServices / totalServices) * 100).toFixed(2)
      },
      services,
      kubernetes: {
        nodes: this.metrics.kubernetes.nodes.length,
        pods: this.metrics.kubernetes.pods.length,
        services: this.metrics.kubernetes.services.length
      },
      docker: {
        containers: this.metrics.docker.containers.length,
        runningContainers: this.metrics.docker.containers.filter(c => c.state === 'running').length
      },
      alerts: {
        total: this.alerts.length,
        unresolved: this.alerts.filter(a => !a.resolved).length,
        critical: this.alerts.filter(a => a.severity === 'critical' && !a.resolved).length
      }
    };
  }

  // Get node status from Kubernetes node object
  getNodeStatus(node) {
    const readyCondition = node.status.conditions.find(c => c.type === 'Ready');
    return readyCondition && readyCondition.status === 'True' ? 'Ready' : 'NotReady';
  }

  // Clean up old metrics to prevent memory issues
  cleanupOldMetrics() {
    const cutoff = Date.now() - (this.config.monitoring.retention * 60 * 60 * 1000);
    
    // Clean up time-series metrics
    this.metrics.kubernetes.nodes = this.metrics.kubernetes.nodes.filter(m => m.timestamp > cutoff);
    this.metrics.kubernetes.pods = this.metrics.kubernetes.pods.filter(m => m.timestamp > cutoff);
    this.metrics.database.connections = this.metrics.database.connections.filter(m => m.timestamp > cutoff);
    this.metrics.redis.memory = this.metrics.redis.memory.filter(m => m.timestamp > cutoff);
    this.metrics.network.connectivity = this.metrics.network.connectivity.filter(m => m.timestamp > cutoff);
  }

  // Generate infrastructure report
  async generateReport() {
    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    const status = this.getInfrastructureStatus();
    const reportFile = path.join(reportDir, `infrastructure-report-${Date.now()}.json`);
    
    await fs.writeFile(reportFile, JSON.stringify({
      status,
      detailedMetrics: this.metrics,
      alerts: this.alerts.slice(-100)
    }, null, 2));
    
    console.log(`📊 Infrastructure report generated: ${reportFile}`);
    return reportFile;
  }

  // Initialize health checks
  initializeHealthChecks() {
    console.log('🏥 Initializing health check endpoints...');
    
    // This would expose health check endpoints
    // GET /health/infrastructure
    // GET /health/services
    // GET /health/kubernetes
  }

  // Shutdown cleanup
  shutdown() {
    console.log('🔄 Shutting down Infrastructure Monitor...');
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    // Generate final report
    this.generateReport();
    
    console.log('✅ Infrastructure Monitor shutdown complete');
  }
}

module.exports = InfrastructureMonitor;
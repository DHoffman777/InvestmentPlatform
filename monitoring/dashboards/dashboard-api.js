const express = require('express');
const BusinessMetricsDashboard = require('./business-metrics-dashboard');

/**
 * Business Metrics Dashboard API Routes
 * RESTful API for dashboard management and real-time metrics
 */
class DashboardAPI {
  constructor() {
    this.router = express.Router();
    this.dashboard = new BusinessMetricsDashboard();
    this.setupRoutes();
    this.setupWebSocket();
  }

  // Setup API routes
  setupRoutes() {
    // Get all dashboards
    this.router.get('/dashboards', (req, res) => {
      try {
        const dashboards = this.dashboard.getAllDashboards();
        res.json({
          success: true,
          data: dashboards,
          timestamp: Date.now()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get specific dashboard
    this.router.get('/dashboards/:id', (req, res) => {
      try {
        const dashboard = this.dashboard.getDashboard(req.params.id);
        if (!dashboard) {
          return res.status(404).json({
            success: false,
            error: 'Dashboard not found'
          });
        }

        res.json({
          success: true,
          data: dashboard,
          timestamp: Date.now()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get business summary
    this.router.get('/summary', (req, res) => {
      try {
        const summary = this.dashboard.getBusinessSummary();
        res.json({
          success: true,
          data: summary,
          timestamp: Date.now()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get metric data
    this.router.get('/metrics/:metricId', (req, res) => {
      try {
        const metric = this.dashboard.metrics.get(req.params.metricId);
        if (!metric) {
          return res.status(404).json({
            success: false,
            error: 'Metric not found'
          });
        }

        const timeRange = req.query.timeRange || '24h';
        const timeRangeMs = this.dashboard.parseTimeRange(timeRange);
        const cutoff = Date.now() - timeRangeMs;

        const filteredValues = metric.values.filter(v => v.timestamp > cutoff);

        res.json({
          success: true,
          data: {
            id: req.params.metricId,
            name: metric.name,
            category: metric.category,
            type: metric.type,
            unit: metric.unit,
            values: filteredValues,
            timeRange
          },
          timestamp: Date.now()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Export dashboard
    this.router.post('/dashboards/:id/export', async (req, res) => {
      try {
        const format = req.body.format || 'json';
        const exportPath = await this.dashboard.exportDashboard(req.params.id, format);
        
        res.json({
          success: true,
          data: {
            exportPath,
            format,
            timestamp: Date.now()
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get alerts
    this.router.get('/alerts', (req, res) => {
      try {
        const status = req.query.status; // 'resolved', 'unresolved', or undefined for all
        const severity = req.query.severity; // 'critical', 'warning', 'info'
        const limit = parseInt(req.query.limit) || 50;

        let alerts = this.dashboard.alerts;

        if (status) {
          alerts = alerts.filter(alert => {
            if (status === 'resolved') return alert.resolved;
            if (status === 'unresolved') return !alert.resolved;
            return true;
          });
        }

        if (severity) {
          alerts = alerts.filter(alert => alert.severity === severity);
        }

        alerts = alerts.slice(-limit);

        res.json({
          success: true,
          data: alerts,
          timestamp: Date.now()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Health check endpoint
    this.router.get('/health', (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: Date.now(),
        services: {
          dashboard: 'running',
          metrics_collection: 'active',
          alert_system: 'active'
        }
      });
    });

    // Generate report
    this.router.post('/reports/generate', async (req, res) => {
      try {
        const reportPath = await this.dashboard.generateReport();
        res.json({
          success: true,
          data: {
            reportPath,
            timestamp: Date.now()
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  // Setup WebSocket for real-time updates
  setupWebSocket() {
    // This would integrate with Socket.IO or similar WebSocket library
    // For now, we'll set up event listeners for real-time updates
    
    this.dashboard.on('metric_updated', (event) => {
      // Broadcast metric update to connected clients
      this.broadcastEvent('metric_updated', event);
    });

    this.dashboard.on('alert_created', (alert) => {
      // Broadcast alert to connected clients
      this.broadcastEvent('alert_created', alert);
    });

    this.dashboard.on('dashboard_refreshed', (event) => {
      // Broadcast dashboard refresh to connected clients
      this.broadcastEvent('dashboard_refreshed', event);
    });
  }

  // Broadcast event to WebSocket clients
  broadcastEvent(eventType, data) {
    // Placeholder for WebSocket broadcasting
    // In a real implementation, this would send to all connected WebSocket clients
    console.log(`📡 Broadcasting ${eventType}:`, data);
  }

  // Get router instance
  getRouter() {
    return this.router;
  }

  // Shutdown API
  shutdown() {
    console.log('🔄 Shutting down Dashboard API...');
    this.dashboard.shutdown();
    console.log('✅ Dashboard API shutdown complete');
  }
}

module.exports = DashboardAPI;
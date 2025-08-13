const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const DependencyScanner = require('./scanner');

/**
 * Continuous Dependency Monitoring System
 * Automated monitoring and alerting for dependency security issues
 */
class ContinuousDependencyMonitor {
  constructor() {
    this.scanner = new DependencyScanner();
    this.config = {
      scanInterval: process.env.SCAN_INTERVAL || '0 2 * * *', // Daily at 2 AM
      alertThresholds: {
        critical: 0, // Alert on any critical vulnerabilities
        high: 3,     // Alert if more than 3 high vulnerabilities
        medium: 10,  // Alert if more than 10 medium vulnerabilities
        outdated: 20 // Alert if more than 20 outdated packages
      },
      notifications: {
        email: {
          enabled: process.env.EMAIL_ALERTS_ENABLED === 'true',
          smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          },
          from: process.env.ALERT_FROM_EMAIL || 'security@investmentplatform.com',
          to: process.env.ALERT_TO_EMAILS?.split(',') || ['security-team@investmentplatform.com']
        },
        slack: {
          enabled: process.env.SLACK_ALERTS_ENABLED === 'true',
          webhook: process.env.SLACK_WEBHOOK_URL
        }
      },
      autoUpdate: {
        enabled: process.env.AUTO_UPDATE_ENABLED === 'true',
        securityOnly: process.env.AUTO_UPDATE_SECURITY_ONLY === 'true',
        testCommand: process.env.AUTO_UPDATE_TEST_CMD || 'npm test',
        maxSeverity: process.env.AUTO_UPDATE_MAX_SEVERITY || 'high' // auto-update up to high severity
      }
    };

    this.history = [];
    this.lastScanResults = null;
  }

  // Start continuous monitoring
  async startMonitoring() {
    console.log('🔄 Starting continuous dependency monitoring...');
    console.log(`📅 Scan schedule: ${this.config.scanInterval}`);
    console.log(`📧 Email alerts: ${this.config.notifications.email.enabled ? 'enabled' : 'disabled'}`);
    console.log(`💬 Slack alerts: ${this.config.notifications.slack.enabled ? 'enabled' : 'disabled'}`);
    console.log(`🔧 Auto-updates: ${this.config.autoUpdate.enabled ? 'enabled' : 'disabled'}\n`);

    // Schedule regular scans
    schedule.scheduleJob(this.config.scanInterval, async () => {
      await this.performScheduledScan();
    });

    // Perform initial scan
    await this.performScheduledScan();

    console.log('✅ Continuous monitoring started successfully');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping continuous monitoring...');
      schedule.gracefulShutdown();
      process.exit(0);
    });
  }

  // Perform scheduled scan and analysis
  async performScheduledScan() {
    console.log(`\n🔍 Starting scheduled dependency scan - ${new Date().toISOString()}`);

    try {
      // Run dependency scan
      await this.scanner.runScan();
      const currentResults = this.scanner.results;

      // Analyze results
      const analysis = await this.analyzeResults(currentResults);
      
      // Store results in history
      this.history.push({
        timestamp: currentResults.timestamp,
        summary: currentResults.summary,
        analysis
      });

      // Keep only last 30 scan results
      if (this.history.length > 30) {
        this.history = this.history.slice(-30);
      }

      // Check if alerts are needed
      if (this.shouldAlert(analysis)) {
        await this.sendAlerts(currentResults, analysis);
      }

      // Auto-update if enabled and safe
      if (this.config.autoUpdate.enabled && this.shouldAutoUpdate(analysis)) {
        await this.performAutoUpdate(currentResults, analysis);
      }

      // Generate trend report
      await this.generateTrendReport();

      this.lastScanResults = currentResults;
      console.log('✅ Scheduled scan completed successfully');

    } catch (error) {
      console.error('❌ Scheduled scan failed:', error.message);
      await this.sendErrorAlert(error);
    }
  }

  // Analyze scan results and trends
  async analyzeResults(currentResults) {
    const analysis = {
      alerts: [],
      trends: {},
      riskScore: 0,
      recommendations: []
    };

    // Compare with previous results
    if (this.lastScanResults) {
      analysis.trends = this.calculateTrends(this.lastScanResults, currentResults);
    }

    // Calculate risk score
    analysis.riskScore = this.calculateRiskScore(currentResults);

    // Check alert thresholds
    if (currentResults.summary.critical > this.config.alertThresholds.critical) {
      analysis.alerts.push({
        type: 'critical_vulnerabilities',
        message: `${currentResults.summary.critical} critical vulnerabilities found`,
        severity: 'critical'
      });
    }

    if (currentResults.summary.high > this.config.alertThresholds.high) {
      analysis.alerts.push({
        type: 'high_vulnerabilities',
        message: `${currentResults.summary.high} high severity vulnerabilities found`,
        severity: 'high'
      });
    }

    if (currentResults.summary.outdated > this.config.alertThresholds.outdated) {
      analysis.alerts.push({
        type: 'outdated_packages',
        message: `${currentResults.summary.outdated} packages are outdated`,
        severity: 'medium'
      });
    }

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(currentResults, analysis);

    return analysis;
  }

  // Calculate trends between scans
  calculateTrends(previous, current) {
    return {
      vulnerabilities: {
        critical: current.summary.critical - previous.summary.critical,
        high: current.summary.high - previous.summary.high,
        medium: current.summary.medium - previous.summary.medium,
        low: current.summary.low - previous.summary.low
      },
      packages: {
        total: current.summary.total - previous.summary.total,
        outdated: current.summary.outdated - previous.summary.outdated
      }
    };
  }

  // Calculate overall risk score
  calculateRiskScore(results) {
    const weights = { critical: 10, high: 5, medium: 2, low: 1 };
    return (
      results.summary.critical * weights.critical +
      results.summary.high * weights.high +
      results.summary.medium * weights.medium +
      results.summary.low * weights.low
    );
  }

  // Generate contextual recommendations
  generateRecommendations(results, analysis) {
    const recommendations = [];

    if (results.summary.critical > 0) {
      recommendations.push({
        priority: 'critical',
        action: 'Immediate Security Update Required',
        description: `Update ${results.summary.critical} packages with critical vulnerabilities immediately`
      });
    }

    if (analysis.riskScore > 50) {
      recommendations.push({
        priority: 'high',
        action: 'Schedule Security Review',
        description: 'High risk score indicates need for comprehensive security review'
      });
    }

    if (results.summary.outdated > 20) {
      recommendations.push({
        priority: 'medium',
        action: 'Update Maintenance',
        description: 'Large number of outdated packages indicates need for regular update schedule'
      });
    }

    return recommendations;
  }

  // Determine if alerts should be sent
  shouldAlert(analysis) {
    return analysis.alerts.length > 0 || analysis.riskScore > 30;
  }

  // Determine if auto-update should be performed
  shouldAutoUpdate(analysis) {
    if (!this.config.autoUpdate.enabled) return false;
    
    // Only auto-update if no critical vulnerabilities and low risk
    return analysis.riskScore < 20 && 
           analysis.alerts.filter(a => a.severity === 'critical').length === 0;
  }

  // Send security alerts
  async sendAlerts(results, analysis) {
    console.log('🚨 Sending security alerts...');

    const alertData = {
      timestamp: results.timestamp,
      summary: results.summary,
      alerts: analysis.alerts,
      riskScore: analysis.riskScore,
      recommendations: analysis.recommendations,
      trends: analysis.trends
    };

    // Send email alerts
    if (this.config.notifications.email.enabled) {
      await this.sendEmailAlert(alertData);
    }

    // Send Slack alerts
    if (this.config.notifications.slack.enabled) {
      await this.sendSlackAlert(alertData);
    }
  }

  // Send email alert
  async sendEmailAlert(alertData) {
    try {
      const transporter = nodemailer.createTransporter(this.config.notifications.email.smtp);
      
      const html = this.generateAlertEmail(alertData);
      
      await transporter.sendMail({
        from: this.config.notifications.email.from,
        to: this.config.notifications.email.to.join(', '),
        subject: `🚨 Dependency Security Alert - Risk Score: ${alertData.riskScore}`,
        html
      });

      console.log('📧 Email alert sent successfully');
    } catch (error) {
      console.error('❌ Failed to send email alert:', error.message);
    }
  }

  // Send Slack alert
  async sendSlackAlert(alertData) {
    try {
      const payload = {
        text: `🚨 Dependency Security Alert`,
        attachments: [
          {
            color: alertData.riskScore > 50 ? 'danger' : alertData.riskScore > 20 ? 'warning' : 'good',
            fields: [
              {
                title: 'Risk Score',
                value: alertData.riskScore,
                short: true
              },
              {
                title: 'Critical Vulnerabilities',
                value: alertData.summary.critical,
                short: true
              },
              {
                title: 'High Vulnerabilities',
                value: alertData.summary.high,
                short: true
              },
              {
                title: 'Outdated Packages',
                value: alertData.summary.outdated,
                short: true
              }
            ],
            text: alertData.alerts.map(alert => `• ${alert.message}`).join('\n')
          }
        ]
      };

      await axios.post(this.config.notifications.slack.webhook, payload);
      console.log('💬 Slack alert sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Slack alert:', error.message);
    }
  }

  // Generate email alert HTML
  generateAlertEmail(alertData) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; }
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .recommendation { background: #d1ecf1; border: 1px solid #bee5eb; padding: 10px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 Dependency Security Alert</h1>
        <p>Generated: ${alertData.timestamp}</p>
        <p>Risk Score: <strong>${alertData.riskScore}</strong></p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>${alertData.summary.critical}</h3>
            <p>Critical</p>
        </div>
        <div class="metric">
            <h3>${alertData.summary.high}</h3>
            <p>High</p>
        </div>
        <div class="metric">
            <h3>${alertData.summary.medium}</h3>
            <p>Medium</p>
        </div>
        <div class="metric">
            <h3>${alertData.summary.outdated}</h3>
            <p>Outdated</p>
        </div>
    </div>

    <h2>🚨 Active Alerts</h2>
    ${alertData.alerts.map(alert => `
        <div class="alert">
            <strong>${alert.severity.toUpperCase()}:</strong> ${alert.message}
        </div>
    `).join('')}

    <h2>💡 Recommendations</h2>
    ${alertData.recommendations.map(rec => `
        <div class="recommendation">
            <strong>${rec.priority.toUpperCase()}:</strong> ${rec.action}<br>
            ${rec.description}
        </div>
    `).join('')}

    <p><strong>Next Steps:</strong></p>
    <ol>
        <li>Review and prioritize critical and high severity vulnerabilities</li>
        <li>Update affected packages to secure versions</li>
        <li>Run comprehensive tests after updates</li>
        <li>Monitor for new vulnerabilities</li>
    </ol>
</body>
</html>`;
  }

  // Perform automatic updates
  async performAutoUpdate(results, analysis) {
    console.log('🔧 Performing automatic security updates...');

    try {
      // Filter vulnerabilities that can be auto-updated
      const updateableVulns = results.vulnerabilities.filter(vuln => 
        this.isUpdateable(vuln) && 
        this.shouldAutoUpdateSeverity(vuln.severity)
      );

      if (updateableVulns.length === 0) {
        console.log('  No vulnerabilities suitable for auto-update');
        return;
      }

      // Create backup
      await this.createBackup();

      // Perform updates
      for (const vuln of updateableVulns) {
        await this.updatePackage(vuln);
      }

      // Run tests
      if (this.config.autoUpdate.testCommand) {
        console.log('  Running tests...');
        execSync(this.config.autoUpdate.testCommand, { stdio: 'inherit' });
      }

      console.log('✅ Auto-updates completed successfully');
      await this.sendAutoUpdateNotification(updateableVulns);

    } catch (error) {
      console.error('❌ Auto-update failed:', error.message);
      await this.rollbackUpdates();
      await this.sendAutoUpdateFailureNotification(error);
    }
  }

  // Check if vulnerability is updateable
  isUpdateable(vuln) {
    return vuln.fixedVersion && vuln.package && vuln.ecosystem === 'npm';
  }

  // Check if severity should be auto-updated
  shouldAutoUpdateSeverity(severity) {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const maxLevel = severityLevels[this.config.autoUpdate.maxSeverity];
    return severityLevels[severity] <= maxLevel;
  }

  // Update individual package
  async updatePackage(vuln) {
    console.log(`  Updating ${vuln.package} to ${vuln.fixedVersion}...`);
    execSync(`npm install ${vuln.package}@${vuln.fixedVersion}`, { stdio: 'inherit' });
  }

  // Create backup before updates
  async createBackup() {
    const backupDir = path.join(process.cwd(), '.dependency-backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    execSync(`cp package.json package-lock.json "${backupPath}/" || true`);
    console.log(`  Backup created: ${backupPath}`);
  }

  // Rollback updates
  async rollbackUpdates() {
    console.log('🔄 Rolling back auto-updates...');
    // Rollback implementation would go here
  }

  // Generate trend report
  async generateTrendReport() {
    if (this.history.length < 2) return;

    const reportDir = path.join(__dirname, 'reports');
    await fs.mkdir(reportDir, { recursive: true });

    const trendData = this.analyzeTrends();
    const reportFile = path.join(reportDir, `dependency-trends-${Date.now()}.json`);
    
    await fs.writeFile(reportFile, JSON.stringify(trendData, null, 2));
    console.log(`📈 Trend report generated: ${reportFile}`);
  }

  // Analyze historical trends
  analyzeTrends() {
    const trends = {
      period: `${this.history[0].timestamp} to ${this.history[this.history.length - 1].timestamp}`,
      metrics: {
        vulnerabilities: [],
        packages: [],
        riskScores: []
      }
    };

    this.history.forEach(scan => {
      trends.metrics.vulnerabilities.push({
        timestamp: scan.timestamp,
        critical: scan.summary.critical,
        high: scan.summary.high,
        medium: scan.summary.medium,
        low: scan.summary.low
      });

      trends.metrics.packages.push({
        timestamp: scan.timestamp,
        total: scan.summary.total,
        outdated: scan.summary.outdated
      });

      trends.metrics.riskScores.push({
        timestamp: scan.timestamp,
        score: scan.analysis?.riskScore || 0
      });
    });

    return trends;
  }

  // Send error alert
  async sendErrorAlert(error) {
    console.log('🚨 Sending error alert...');
    
    if (this.config.notifications.email.enabled) {
      try {
        const transporter = nodemailer.createTransporter(this.config.notifications.email.smtp);
        
        await transporter.sendMail({
          from: this.config.notifications.email.from,
          to: this.config.notifications.email.to.join(', '),
          subject: '❌ Dependency Scanner Error',
          html: `
            <h2>❌ Dependency Scanner Error</h2>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Stack:</strong></p>
            <pre>${error.stack}</pre>
          `
        });
      } catch (emailError) {
        console.error('Failed to send error alert:', emailError.message);
      }
    }
  }

  // Send auto-update notifications
  async sendAutoUpdateNotification(updates) {
    // Implementation for auto-update success notification
  }

  async sendAutoUpdateFailureNotification(error) {
    // Implementation for auto-update failure notification
  }
}

// Command line interface
if (require.main === module) {
  const monitor = new ContinuousDependencyMonitor();
  monitor.startMonitoring().catch(console.error);
}

module.exports = ContinuousDependencyMonitor;
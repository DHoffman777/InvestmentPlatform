#!/usr/bin/env ts-node

import { SecurityAuditFramework, SecurityAuditConfig, AuditType, ComplianceFramework } from './SecurityAuditFramework';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Security Audit Runner CLI
 * Command-line interface for executing comprehensive security audits
 */

interface SecurityCliOptions {
  config?: string;
  audit?: string;
  env?: string;
  scope?: string[];
  compliance?: string[];
  output?: string;
  format?: string[];
  scheduled?: boolean;
  verbose?: boolean;
  help?: boolean;
}

class SecurityAuditRunner {
  private options: SecurityCliOptions;
  private defaultConfig: SecurityAuditConfig;

  constructor(options: SecurityCliOptions) {
    this.options = options;
    this.defaultConfig = this.createDefaultConfig();
  }

  public async run(): Promise<void> {
    try {
      if (this.options.help) {
        this.showHelp();
        return;
      }

      console.log('🔒 Investment Platform Security Audit Suite');
      console.log('==========================================\n');

      // Load configuration
      const config = await this.loadSecurityConfiguration();
      
      // Create audit framework instance
      const framework = new SecurityAuditFramework(config);
      
      // Setup event listeners
      this.setupSecurityEventListeners(framework);
      
      // Execute selected audit type
      const result = await this.executeSelectedAudit(framework);
      
      // Display security results summary
      this.displaySecuritySummary(result);
      
      // Generate alerts if critical issues found
      await this.handleCriticalFindings(result);
      
      // Exit with appropriate code
      const criticalIssues = result.findings.filter(f => f.severity === 'CRITICAL').length;
      process.exit(criticalIssues > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('❌ Security audit execution failed:', error.message);
      if (this.options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  private async loadSecurityConfiguration(): Promise<SecurityAuditConfig> {
    let config = { ...this.defaultConfig };
    
    // Load from config file if specified
    if (this.options.config) {
      const configPath = path.resolve(this.options.config);
      if (fs.existsSync(configPath)) {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config = { ...config, ...fileConfig };
        console.log(`📄 Loaded security configuration from: ${configPath}`);
      } else {
        throw new Error(`Configuration file not found: ${configPath}`);
      }
    }
    
    // Override with CLI options
    if (this.options.scope) {
      config.scope.applications = this.options.scope;
    }
    
    if (this.options.compliance) {
      config.compliance = this.options.compliance as ComplianceFramework[];
    }
    
    if (this.options.env) {
      config.environment.baseUrl = this.getEnvironmentUrl(this.options.env);
    }
    
    if (this.options.output) {
      config.reporting.outputDir = this.options.output;
    }
    
    if (this.options.format) {
      config.reporting.formats = this.options.format as any[];
    }
    
    return config;
  }

  private async executeSelectedAudit(framework: SecurityAuditFramework): Promise<any> {
    const auditType = this.options.audit || 'comprehensive';
    
    console.log(`🎯 Executing security audit type: ${auditType}\n`);
    
    switch (auditType.toLowerCase()) {
      case 'comprehensive':
      case 'full':
        return await framework.executeSecurityAudit();
        
      case 'vulnerability':
      case 'vuln':
        return await this.executeVulnerabilityOnlyAudit(framework);
        
      case 'penetration':
      case 'pentest':
        return await this.executePenetrationTestingOnly(framework);
        
      case 'code':
      case 'code-review':
        return await this.executeCodeSecurityReviewOnly(framework);
        
      case 'compliance':
        return await this.executeComplianceAuditOnly(framework);
        
      case 'configuration':
      case 'config':
        return await this.executeConfigurationAuditOnly(framework);
        
      case 'continuous':
        return await this.executeContinuousSecurityScan(framework);
        
      default:
        throw new Error(`Unknown audit type: ${auditType}`);
    }
  }

  private async executeVulnerabilityOnlyAudit(framework: SecurityAuditFramework): Promise<any> {
    console.log('🔍 Starting comprehensive vulnerability assessment...');
    
    const findings = await framework.executeVulnerabilityAssessment();
    
    return {
      auditId: `vuln-assessment-${Date.now()}`,
      auditType: 'vulnerability_assessment',
      findings,
      summary: this.generateFindingsSummary(findings),
      recommendations: this.generateVulnerabilityRecommendations(findings)
    };
  }

  private async executePenetrationTestingOnly(framework: SecurityAuditFramework): Promise<any> {
    console.log('🎯 Starting penetration testing...');
    
    const findings = await framework.executePenetrationTesting();
    
    return {
      auditId: `pentest-${Date.now()}`,
      auditType: 'penetration_testing',
      findings,
      summary: this.generateFindingsSummary(findings),
      recommendations: this.generatePenetrationTestRecommendations(findings)
    };
  }

  private async executeCodeSecurityReviewOnly(framework: SecurityAuditFramework): Promise<any> {
    console.log('💻 Starting code security review...');
    
    const findings = await framework.executeCodeSecurityReview();
    
    return {
      auditId: `code-review-${Date.now()}`,
      auditType: 'code_security_review',
      findings,
      summary: this.generateFindingsSummary(findings),
      recommendations: this.generateCodeSecurityRecommendations(findings)
    };
  }

  private async executeComplianceAuditOnly(framework: SecurityAuditFramework): Promise<any> {
    console.log('📋 Starting compliance audit...');
    
    // Execute basic security audit first to get findings
    const result = await framework.executeSecurityAudit();
    
    return {
      auditId: `compliance-audit-${Date.now()}`,
      auditType: 'compliance_audit',
      complianceStatus: result.complianceStatus,
      findings: result.findings.filter(f => f.category === 'SECURITY_MISCONFIGURATION'),
      summary: this.generateComplianceSummary(result.complianceStatus),
      recommendations: this.generateComplianceRecommendations(result.complianceStatus)
    };
  }

  private async executeConfigurationAuditOnly(framework: SecurityAuditFramework): Promise<any> {
    console.log('⚙️ Starting configuration security audit...');
    
    // This would use a configuration-specific scanner
    const findings = await this.performConfigurationAudit();
    
    return {
      auditId: `config-audit-${Date.now()}`,
      auditType: 'configuration_audit',
      findings,
      summary: this.generateFindingsSummary(findings),
      recommendations: this.generateConfigurationRecommendations(findings)
    };
  }

  private async executeContinuousSecurityScan(framework: SecurityAuditFramework): Promise<any> {
    console.log('🔄 Starting continuous security scanning...');
    
    const results = [];
    const scanInterval = 300000; // 5 minutes
    const totalDuration = 3600000; // 1 hour
    const endTime = Date.now() + totalDuration;
    
    while (Date.now() < endTime) {
      console.log('\n📊 Performing scheduled security scan...');
      
      try {
        const scanResult = await framework.executeVulnerabilityAssessment();
        results.push({
          timestamp: new Date(),
          findings: scanResult,
          summary: this.generateFindingsSummary(scanResult)
        });
        
        // Alert on new critical findings
        const criticalFindings = scanResult.filter(f => f.severity === 'CRITICAL');
        if (criticalFindings.length > 0) {
          console.log(`🚨 ALERT: ${criticalFindings.length} critical vulnerabilities detected!`);
          await this.sendSecurityAlert(criticalFindings);
        }
        
      } catch (error) {
        console.error(`Scan failed: ${error.message}`);
      }
      
      // Wait for next scan
      console.log(`⏳ Next scan in ${scanInterval / 1000 / 60} minutes...`);
      await this.sleep(scanInterval);
    }
    
    return {
      auditId: `continuous-scan-${Date.now()}`,
      auditType: 'continuous_monitoring',
      scanResults: results,
      summary: this.generateContinuousScanSummary(results),
      recommendations: this.generateContinuousMonitoringRecommendations(results)
    };
  }

  private setupSecurityEventListeners(framework: SecurityAuditFramework): void {
    framework.on('auditStarted', (data) => {
      console.log(`🎬 Security audit started: ${data.auditId}`);
      console.log(`🔍 Audit types: ${data.config.auditTypes.join(', ')}`);
      console.log(`📊 Compliance frameworks: ${data.config.compliance.join(', ')}`);
      console.log(`🎯 Target: ${data.config.environment.baseUrl}\n`);
    });
    
    framework.on('auditCompleted', (result) => {
      console.log(`\n✅ Security audit completed: ${result.auditId}`);
      console.log(`⏱️  Total duration: ${Math.round(result.duration / 1000 / 60)} minutes`);
      console.log(`🔍 Total findings: ${result.findings.length}`);
    });
    
    framework.on('auditFailed', (error) => {
      console.error(`\n❌ Security audit failed: ${error.auditId}`);
      console.error(`💥 Error: ${error.error}`);
    });
    
    framework.on('criticalFindingDetected', (finding) => {
      console.log(`\n🚨 CRITICAL VULNERABILITY DETECTED:`);
      console.log(`   Title: ${finding.title}`);
      console.log(`   Location: ${finding.location.component}`);
      console.log(`   CVE: ${finding.cve || 'N/A'}`);
      console.log(`   CVSS: ${finding.cvss?.baseScore || 'N/A'}`);
    });
    
    // Progress updates for verbose mode
    if (this.options.verbose) {
      framework.on('scanProgress', (data) => {
        console.log(`📊 ${data.scanType}: ${data.completed}/${data.total} targets scanned`);
      });
      
      framework.on('findingDiscovered', (finding) => {
        console.log(`🔍 Found: ${finding.severity} - ${finding.title} in ${finding.location.component}`);
      });
    }
  }

  private displaySecuritySummary(result: any): void {
    console.log('\n🔒 SECURITY AUDIT RESULTS SUMMARY');
    console.log('==================================');
    
    // Overall security status
    const criticalCount = result.findings?.filter(f => f.severity === 'CRITICAL').length || 0;
    const highCount = result.findings?.filter(f => f.severity === 'HIGH').length || 0;
    const status = criticalCount === 0 && highCount === 0 ? '✅ SECURE' : '⚠️  VULNERABILITIES FOUND';
    console.log(`Security Status: ${status}\n`);
    
    // Findings summary
    if (result.findings) {
      console.log('🎯 Security Findings:');
      console.log(`   Critical: ${criticalCount}`);
      console.log(`   High: ${highCount}`);
      console.log(`   Medium: ${result.findings.filter(f => f.severity === 'MEDIUM').length}`);
      console.log(`   Low: ${result.findings.filter(f => f.severity === 'LOW').length}`);
      console.log(`   Total: ${result.findings.length}\n`);
    }
    
    // Risk assessment
    if (result.summary?.riskScore !== undefined) {
      console.log('📊 Risk Assessment:');
      console.log(`   Overall Risk Score: ${result.summary.riskScore}/100`);
      console.log(`   Risk Level: ${this.getRiskLevel(result.summary.riskScore)}\n`);
    }
    
    // Compliance status
    if (result.complianceStatus) {
      console.log('📋 Compliance Status:');
      result.complianceStatus.forEach(status => {
        const complianceStatus = status.score >= 80 ? '✅ Compliant' : '❌ Non-Compliant';
        console.log(`   ${status.framework}: ${status.score}% - ${complianceStatus}`);
      });
      console.log();
    }
    
    // Top critical findings
    if (result.findings) {
      const criticalFindings = result.findings.filter(f => f.severity === 'CRITICAL').slice(0, 5);
      if (criticalFindings.length > 0) {
        console.log('🚨 Top Critical Vulnerabilities:');
        criticalFindings.forEach((finding, index) => {
          console.log(`   ${index + 1}. ${finding.title}`);
          console.log(`      Location: ${finding.location.component}`);
          console.log(`      CVE: ${finding.cve || 'N/A'}`);
          console.log(`      CVSS: ${finding.cvss?.baseScore || 'N/A'}`);
        });
        console.log();
      }
    }
    
    // Recommendations
    if (result.recommendations) {
      console.log('💡 Top Security Recommendations:');
      result.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.title} (${rec.priority})`);
        console.log(`      Timeline: ${rec.timeline}`);
      });
    }
    
    // Report files
    console.log(`\n📄 Detailed security reports generated in: ${this.options.output || './security-audit-results'}`);
    const formats = this.options.format || ['html', 'json', 'pdf'];
    formats.forEach(format => {
      console.log(`   • ${format.toUpperCase()} Report: ${result.auditId}-security-report.${format}`);
    });
  }

  private async handleCriticalFindings(result: any): Promise<void> {
    if (!result.findings) return;
    
    const criticalFindings = result.findings.filter(f => f.severity === 'CRITICAL');
    
    if (criticalFindings.length > 0) {
      console.log(`\n🚨 SECURITY ALERT: ${criticalFindings.length} critical vulnerabilities require immediate attention!`);
      
      // Send alerts to security team
      await this.sendSecurityAlert(criticalFindings);
      
      // Create emergency remediation plan
      const emergencyPlan = this.createEmergencyRemediationPlan(criticalFindings);
      console.log('\n📋 Emergency Remediation Plan Created:');
      emergencyPlan.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} - Due: ${item.dueDate.toLocaleDateString()}`);
      });
    }
  }

  private createDefaultConfig(): SecurityAuditConfig {
    return {
      auditName: 'Investment Platform Security Audit',
      scope: {
        applications: [
          'https://app.investmentplatform.com',
          'https://api.investmentplatform.com',
          'https://admin.investmentplatform.com'
        ],
        networks: ['10.0.0.0/16', '172.16.0.0/12'],
        databases: ['postgresql://prod-db:5432', 'redis://prod-cache:6379'],
        apis: [
          '/api/v1/portfolios',
          '/api/v1/orders',
          '/api/v1/market-data',
          '/api/v1/reports',
          '/api/v1/auth'
        ],
        infrastructure: ['AWS EC2', 'AWS RDS', 'AWS S3', 'AWS Lambda'],
        thirdPartyServices: ['Auth0', 'Stripe', 'Plaid', 'Bloomberg API']
      },
      auditTypes: [
        'vulnerability_assessment',
        'penetration_testing',
        'code_security_review',
        'configuration_audit',
        'access_control_audit',
        'data_protection_audit',
        'compliance_audit'
      ],
      environment: {
        name: process.env.SECURITY_AUDIT_ENV || 'staging',
        baseUrl: process.env.SECURITY_AUDIT_URL || 'https://staging.investmentplatform.com',
        credentials: {
          apiKeys: {
            platform: process.env.PLATFORM_API_KEY || '',
            monitoring: process.env.MONITORING_API_KEY || ''
          },
          testAccounts: [
            {
              username: 'security-test-admin@testfirm.com',
              password: 'SecureTest123!',
              role: 'admin',
              permissions: ['*'],
              mfaEnabled: true
            },
            {
              username: 'security-test-user@testfirm.com',
              password: 'SecureTest123!',
              role: 'portfolio_manager',
              permissions: ['portfolio.read', 'portfolio.write', 'orders.create'],
              mfaEnabled: false
            }
          ],
          adminAccess: {
            username: 'security-audit-admin',
            password: process.env.ADMIN_PASSWORD || '',
            accessToken: process.env.ADMIN_ACCESS_TOKEN || ''
          }
        },
        networkRange: ['10.0.0.0/16'],
        excludedTargets: ['10.0.1.100'] // Production database
      },
      compliance: ['SOC2', 'PCI_DSS', 'GDPR', 'FINRA', 'SEC', 'ISO27001', 'NIST_CSF'],
      reporting: {
        formats: ['html', 'json', 'pdf', 'csv'],
        outputDir: './security-audit-results',
        executiveSummary: true,
        technicalDetails: true,
        remediationPlan: true,
        complianceMapping: true
      },
      scheduledScans: [
        {
          name: 'Daily Vulnerability Scan',
          schedule: '0 2 * * *', // 2 AM daily
          auditTypes: ['vulnerability_assessment'],
          autoRemediate: false,
          alertThresholds: [
            {
              severity: 'CRITICAL',
              count: 1,
              timeWindow: 60,
              escalation: [
                {
                  level: 1,
                  delay: 0,
                  recipients: ['security-team@company.com'],
                  actions: ['create_incident', 'notify_oncall']
                }
              ]
            }
          ]
        }
      ]
    };
  }

  private getEnvironmentUrl(env: string): string {
    const envUrls = {
      local: 'http://localhost:3000',
      dev: 'https://dev.investmentplatform.com',
      staging: 'https://staging.investmentplatform.com',
      prod: 'https://app.investmentplatform.com'
    };
    
    return envUrls[env] || env;
  }

  private generateFindingsSummary(findings: any[]): any {
    const severityCounts = findings.reduce((acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      totalFindings: findings.length,
      severityCounts,
      riskScore: this.calculateRiskScore(findings)
    };
  }

  private calculateRiskScore(findings: any[]): number {
    const weights = { CRITICAL: 10, HIGH: 7, MEDIUM: 4, LOW: 2, INFO: 1 };
    const totalRisk = findings.reduce((acc, finding) => {
      return acc + (weights[finding.severity] || 0);
    }, 0);
    
    return Math.min(100, totalRisk);
  }

  private getRiskLevel(score: number): string {
    if (score >= 80) return '🔴 Critical Risk';
    if (score >= 60) return '🟠 High Risk';
    if (score >= 40) return '🟡 Medium Risk';
    if (score >= 20) return '🟢 Low Risk';
    return '🔵 Minimal Risk';
  }

  private async sendSecurityAlert(findings: any[]): Promise<void> {
    // Mock security alert implementation
    console.log('📧 Sending security alerts to security team...');
    
    // In real implementation, this would integrate with:
    // - Slack/Microsoft Teams
    // - Email notifications
    // - PagerDuty/OpsGenie
    // - SIEM systems
    // - Security orchestration platforms
  }

  private createEmergencyRemediationPlan(findings: any[]): any[] {
    return findings.map((finding, index) => ({
      id: `emergency-${index + 1}`,
      title: `URGENT: Fix ${finding.title}`,
      description: finding.remediation,
      priority: index + 1,
      assignee: 'Security Team Lead',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      status: 'PENDING',
      escalation: true
    }));
  }

  // Placeholder methods for specific audit types
  private async performConfigurationAudit(): Promise<any[]> {
    // Configuration security audit implementation
    return [];
  }

  private generateVulnerabilityRecommendations(findings: any[]): any[] {
    return [
      {
        title: 'Implement Automated Vulnerability Scanning',
        priority: 'HIGH',
        timeline: '2 weeks'
      }
    ];
  }

  private generatePenetrationTestRecommendations(findings: any[]): any[] {
    return [
      {
        title: 'Strengthen Input Validation',
        priority: 'HIGH',
        timeline: '3 weeks'
      }
    ];
  }

  private generateCodeSecurityRecommendations(findings: any[]): any[] {
    return [
      {
        title: 'Implement Static Code Analysis in CI/CD',
        priority: 'MEDIUM',
        timeline: '1 week'
      }
    ];
  }

  private generateComplianceSummary(complianceStatus: any[]): any {
    return {
      overallScore: complianceStatus.reduce((acc, status) => acc + status.score, 0) / complianceStatus.length,
      compliantFrameworks: complianceStatus.filter(s => s.score >= 80).length,
      totalFrameworks: complianceStatus.length
    };
  }

  private generateComplianceRecommendations(complianceStatus: any[]): any[] {
    return [
      {
        title: 'Address Compliance Gaps',
        priority: 'HIGH',
        timeline: '4 weeks'
      }
    ];
  }

  private generateConfigurationRecommendations(findings: any[]): any[] {
    return [
      {
        title: 'Harden System Configurations',
        priority: 'MEDIUM',
        timeline: '2 weeks'
      }
    ];
  }

  private generateContinuousScanSummary(results: any[]): any {
    return {
      totalScans: results.length,
      averageFindings: results.reduce((acc, r) => acc + r.findings.length, 0) / results.length,
      trendAnalysis: 'Improving' // Placeholder
    };
  }

  private generateContinuousMonitoringRecommendations(results: any[]): any[] {
    return [
      {
        title: 'Implement Real-time Security Monitoring',
        priority: 'HIGH',
        timeline: '3 weeks'
      }
    ];
  }

  private showHelp(): void {
    console.log(`
🔒 Investment Platform Security Audit CLI

Usage: ts-node security-audit-runner.ts [options]

Options:
  --config <file>           Load configuration from JSON file
  --audit <type>            Audit type: comprehensive|vulnerability|penetration|code|compliance|config|continuous
  --env <environment>       Target environment: local|dev|staging|prod
  --scope <applications>    Comma-separated list of applications to audit
  --compliance <frameworks> Comma-separated compliance frameworks: SOC2,PCI_DSS,GDPR,FINRA
  --output <directory>      Output directory for reports (default: ./security-audit-results)
  --format <formats>        Report formats: html,json,pdf,csv (default: html,json,pdf)
  --scheduled               Run as scheduled/continuous scan
  --verbose                 Enable verbose logging
  --help                    Show this help message

Audit Types:
  comprehensive             Full security audit (all audit types)
  vulnerability            Vulnerability assessment only
  penetration              Penetration testing only
  code                     Code security review only
  compliance               Compliance audit only
  config                   Configuration security audit only
  continuous               Continuous security monitoring

Compliance Frameworks:
  SOC2                     SOC 2 Type II controls
  PCI_DSS                  Payment Card Industry Data Security Standard
  GDPR                     General Data Protection Regulation
  FINRA                    Financial Industry Regulatory Authority
  SEC                      Securities and Exchange Commission
  ISO27001                 ISO/IEC 27001 Information Security Management
  NIST_CSF                 NIST Cybersecurity Framework

Examples:
  # Comprehensive security audit
  ts-node security-audit-runner.ts --audit comprehensive --env staging

  # Vulnerability assessment only
  ts-node security-audit-runner.ts --audit vulnerability --verbose

  # Compliance audit for specific frameworks
  ts-node security-audit-runner.ts --audit compliance --compliance SOC2,PCI_DSS

  # Penetration testing with custom output
  ts-node security-audit-runner.ts --audit penetration --output ./pentest-results

  # Continuous security monitoring
  ts-node security-audit-runner.ts --audit continuous --scheduled

Environment Variables:
  SECURITY_AUDIT_ENV        Target environment
  SECURITY_AUDIT_URL        Base URL for security testing
  PLATFORM_API_KEY          API key for platform access
  ADMIN_PASSWORD            Admin password for testing
  ADMIN_ACCESS_TOKEN        Admin access token

Report Outputs:
  HTML Report              Executive and technical security report
  JSON Report              Machine-readable detailed results
  PDF Report               Executive summary for management
  CSV Report               Vulnerability and finding details
    `);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Parse command line arguments
function parseSecurityArguments(): SecurityCliOptions {
  const args = process.argv.slice(2);
  const options: SecurityCliOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--config':
        options.config = args[++i];
        break;
      case '--audit':
        options.audit = args[++i];
        break;
      case '--env':
        options.env = args[++i];
        break;
      case '--scope':
        options.scope = args[++i].split(',');
        break;
      case '--compliance':
        options.compliance = args[++i].split(',');
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--format':
        options.format = args[++i].split(',');
        break;
      case '--scheduled':
        options.scheduled = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        options.help = true;
        break;
    }
  }
  
  return options;
}

// Main execution
if (require.main === module) {
  const options = parseSecurityArguments();
  const runner = new SecurityAuditRunner(options);
  
  runner.run().catch(error => {
    console.error('Security audit runner failed:', error);
    process.exit(1);
  });
}

export { SecurityAuditRunner };
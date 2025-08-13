import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ContainerImage {
  id: string;
  name: string;
  tag: string;
  registry: string;
  digest: string;
  size: number;
  created: Date;
  labels: Record<string, string>;
}

export interface Vulnerability {
  id: string;
  cveId?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'negligible';
  score: number;
  package: string;
  version: string;
  fixedVersion?: string;
  description: string;
  references: string[];
  publishedDate: Date;
  lastModified: Date;
}

export interface ScanResult {
  scanId: string;
  imageId: string;
  imageName: string;
  scanDate: Date;
  scanDuration: number;
  status: 'completed' | 'failed' | 'in_progress';
  vulnerabilities: Vulnerability[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    negligible: number;
    total: number;
  };
  compliance: ComplianceResult[];
  recommendations: SecurityRecommendation[];
}

export interface ComplianceResult {
  standard: 'CIS' | 'NIST' | 'PCI_DSS' | 'SOX' | 'FINRA';
  controlId: string;
  title: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface SecurityRecommendation {
  type: 'vulnerability_fix' | 'configuration_change' | 'policy_update';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

export interface ScanPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: ScanTrigger[];
  severityThresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  complianceStandards: string[];
  notifications: NotificationConfig[];
}

export interface ScanTrigger {
  type: 'scheduled' | 'on_push' | 'on_deploy' | 'manual';
  schedule?: string; // Cron expression
  registries?: string[];
  imagePatterns?: string[];
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  endpoint: string;
  conditions: string[];
  template: string;
}

/**
 * Container Security Scanner
 * Provides comprehensive vulnerability scanning and compliance checking for container images
 */
export class ContainerSecurityScanner extends EventEmitter {
  private scanResults: Map<string, ScanResult> = new Map();
  private scanPolicies: Map<string, ScanPolicy> = new Map();
  private knownVulnerabilities: Map<string, Vulnerability[]> = new Map();
  private registryCredentials: Map<string, any> = new Map();

  constructor() {
    super();
    this.initializeVulnerabilityDatabase();
    this.initializeDefaultPolicies();
  }

  /**
   * Scan container image for vulnerabilities
   */
  public async scanImage(
    imageName: string,
    tag: string = 'latest',
    options: {
      registry?: string;
      policyId?: string;
      deepScan?: boolean;
      complianceChecks?: boolean;
    } = {}
  ): Promise<ScanResult> {
    try {
      const scanId = randomUUID();
      const startTime = Date.now();
      
      this.emit('scanStarted', {
        scanId,
        imageName,
        tag,
        timestamp: new Date()
      });

      // Pull image metadata
      const image = await this.getImageMetadata(imageName, tag, options.registry);
      
      // Initialize scan result
      const scanResult: ScanResult = {
        scanId,
        imageId: image.id,
        imageName: `${imageName}:${tag}`,
        scanDate: new Date(),
        scanDuration: 0,
        status: 'in_progress',
        vulnerabilities: [],
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          negligible: 0,
          total: 0
        },
        compliance: [],
        recommendations: []
      };

      // Perform vulnerability scan
      const vulnerabilities = await this.performVulnerabilityScan(image, options.deepScan);
      scanResult.vulnerabilities = vulnerabilities;

      // Update vulnerability summary
      this.updateVulnerabilitySummary(scanResult);

      // Perform compliance checks if requested
      if (options.complianceChecks) {
        scanResult.compliance = await this.performComplianceChecks(image);
      }

      // Generate security recommendations
      scanResult.recommendations = this.generateRecommendations(scanResult);

      // Finalize scan
      scanResult.status = 'completed';
      scanResult.scanDuration = Date.now() - startTime;
      
      this.scanResults.set(scanId, scanResult);

      // Apply policy checks
      if (options.policyId) {
        await this.applyPolicyChecks(scanResult, options.policyId);
      }

      this.emit('scanCompleted', {
        scanId,
        imageName: scanResult.imageName,
        vulnerabilityCount: scanResult.summary.total,
        criticalCount: scanResult.summary.critical,
        highCount: scanResult.summary.high,
        duration: scanResult.scanDuration,
        timestamp: new Date()
      });

      return scanResult;

    } catch (error) {
      this.emit('scanError', {
        imageName,
        tag,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Scan multiple images in batch
   */
  public async batchScan(
    images: Array<{ name: string; tag?: string; registry?: string }>,
    options: { policyId?: string; maxConcurrent?: number } = {}
  ): Promise<ScanResult[]> {
    const maxConcurrent = options.maxConcurrent || 5;
    const results: ScanResult[] = [];
    
    for (let i = 0; i < images.length; i += maxConcurrent) {
      const batch = images.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(img => 
        this.scanImage(img.name, img.tag, { 
          registry: img.registry, 
          policyId: options.policyId 
        })
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }

    return results;
  }

  /**
   * Get scan result by ID
   */
  public getScanResult(scanId: string): ScanResult | null {
    return this.scanResults.get(scanId) || null;
  }

  /**
   * Get scan history for image
   */
  public getImageScanHistory(imageName: string, limit: number = 10): ScanResult[] {
    return Array.from(this.scanResults.values())
      .filter(result => result.imageName.startsWith(imageName.split(':')[0]))
      .sort((a, b) => b.scanDate.getTime() - a.scanDate.getTime())
      .slice(0, limit);
  }

  /**
   * Create scan policy
   */
  public createScanPolicy(policy: Omit<ScanPolicy, 'id'>): ScanPolicy {
    const policyId = randomUUID();
    const newPolicy: ScanPolicy = {
      ...policy,
      id: policyId
    };

    this.scanPolicies.set(policyId, newPolicy);

    this.emit('policyCreated', {
      policyId,
      name: policy.name,
      timestamp: new Date()
    });

    return newPolicy;
  }

  /**
   * Generate security report
   */
  public generateSecurityReport(
    timeRange: { start: Date; end: Date },
    filters?: {
      registries?: string[];
      severities?: string[];
      imagePatterns?: string[];
    }
  ): {
    summary: {
      totalScans: number;
      uniqueImages: number;
      totalVulnerabilities: number;
      criticalVulnerabilities: number;
      highVulnerabilities: number;
      riskScore: number;
    };
    trends: {
      date: Date;
      scans: number;
      vulnerabilities: number;
      riskScore: number;
    }[];
    topRiskyImages: {
      imageName: string;
      riskScore: number;
      criticalCount: number;
      highCount: number;
      lastScan: Date;
    }[];
    recommendations: SecurityRecommendation[];
  } {
    const filteredResults = this.filterScanResults(timeRange, filters);
    
    const summary = {
      totalScans: filteredResults.length,
      uniqueImages: new Set(filteredResults.map(r => r.imageName.split(':')[0])).size,
      totalVulnerabilities: filteredResults.reduce((sum, r) => sum + r.summary.total, 0),
      criticalVulnerabilities: filteredResults.reduce((sum, r) => sum + r.summary.critical, 0),
      highVulnerabilities: filteredResults.reduce((sum, r) => sum + r.summary.high, 0),
      riskScore: this.calculateOverallRiskScore(filteredResults)
    };

    const trends = this.generateTrends(filteredResults, timeRange);
    const topRiskyImages = this.getTopRiskyImages(filteredResults, 10);
    const recommendations = this.generateOverallRecommendations(filteredResults);

    return {
      summary,
      trends,
      topRiskyImages,
      recommendations
    };
  }

  // Private helper methods

  private async getImageMetadata(
    imageName: string,
    tag: string,
    registry?: string
  ): Promise<ContainerImage> {
    // In production, this would interact with container registry API
    return {
      id: randomUUID(),
      name: imageName,
      tag,
      registry: registry || 'docker.io',
      digest: 'sha256:' + randomUUID().replace(/-/g, ''),
      size: Math.floor(Math.random() * 1000000000), // Random size
      created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      labels: {
        'maintainer': 'investment-platform-team',
        'version': '1.0.0',
        'environment': 'production'
      }
    };
  }

  private async performVulnerabilityScan(
    image: ContainerImage,
    deepScan: boolean = false
  ): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];
    
    // Simulate scanning different package managers and layers
    const packageManagers = ['npm', 'pip', 'maven', 'apt', 'yum'];
    
    for (const pm of packageManagers) {
      const pmVulns = await this.scanPackageManager(image, pm, deepScan);
      vulnerabilities.push(...pmVulns);
    }

    if (deepScan) {
      // Additional checks for deep scan
      const configVulns = await this.scanConfiguration(image);
      vulnerabilities.push(...configVulns);
    }

    return vulnerabilities;
  }

  private async scanPackageManager(
    image: ContainerImage,
    packageManager: string,
    deepScan: boolean
  ): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];
    const vulnCount = Math.floor(Math.random() * (deepScan ? 20 : 10));

    for (let i = 0; i < vulnCount; i++) {
      const severity = this.getRandomSeverity();
      vulnerabilities.push({
        id: randomUUID(),
        cveId: `CVE-2024-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        severity,
        score: this.getSeverityScore(severity),
        package: `${packageManager}-package-${i}`,
        version: '1.0.0',
        fixedVersion: '1.0.1',
        description: `Security vulnerability in ${packageManager} package`,
        references: [`https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-${i}`],
        publishedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastModified: new Date()
      });
    }

    return vulnerabilities;
  }

  private async scanConfiguration(image: ContainerImage): Promise<Vulnerability[]> {
    const configVulns: Vulnerability[] = [];
    
    // Check for common misconfigurations
    const misconfigurations = [
      'Running as root user',
      'Exposed sensitive ports',
      'Weak file permissions',
      'Missing security headers',
      'Outdated base image'
    ];

    for (const config of misconfigurations) {
      if (Math.random() < 0.3) { // 30% chance of each misconfiguration
        configVulns.push({
          id: randomUUID(),
          severity: 'medium',
          score: 5.0,
          package: 'container-config',
          version: 'N/A',
          description: config,
          references: [],
          publishedDate: new Date(),
          lastModified: new Date()
        });
      }
    }

    return configVulns;
  }

  private async performComplianceChecks(image: ContainerImage): Promise<ComplianceResult[]> {
    const complianceResults: ComplianceResult[] = [];
    
    const checks = [
      {
        standard: 'CIS' as const,
        controlId: 'CIS-4.1',
        title: 'Create a user for the container',
        description: 'Container should not run as root'
      },
      {
        standard: 'NIST' as const,
        controlId: 'NIST-SC-4',
        title: 'Information in shared resources',
        description: 'Sensitive information protection'
      },
      {
        standard: 'PCI_DSS' as const,
        controlId: 'PCI-6.5.1',
        title: 'Injection flaws',
        description: 'Protection against injection attacks'
      }
    ];

    for (const check of checks) {
      complianceResults.push({
        ...check,
        status: Math.random() > 0.3 ? 'pass' : 'fail',
        severity: Math.random() > 0.7 ? 'high' : 'medium'
      });
    }

    return complianceResults;
  }

  private updateVulnerabilitySummary(scanResult: ScanResult): void {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      negligible: 0,
      total: 0
    };

    for (const vuln of scanResult.vulnerabilities) {
      summary[vuln.severity]++;
      summary.total++;
    }

    scanResult.summary = summary;
  }

  private generateRecommendations(scanResult: ScanResult): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];

    if (scanResult.summary.critical > 0) {
      recommendations.push({
        type: 'vulnerability_fix',
        priority: 'critical',
        title: 'Fix Critical Vulnerabilities',
        description: `${scanResult.summary.critical} critical vulnerabilities found`,
        action: 'Update packages to fixed versions immediately',
        impact: 'High security risk if not addressed',
        effort: 'medium'
      });
    }

    if (scanResult.summary.high > 5) {
      recommendations.push({
        type: 'vulnerability_fix',
        priority: 'high',
        title: 'Address High Severity Vulnerabilities',
        description: `${scanResult.summary.high} high severity vulnerabilities found`,
        action: 'Plan package updates within 7 days',
        impact: 'Moderate security risk',
        effort: 'medium'
      });
    }

    // Add configuration recommendations
    const failedCompliance = scanResult.compliance.filter(c => c.status === 'fail');
    if (failedCompliance.length > 0) {
      recommendations.push({
        type: 'configuration_change',
        priority: 'medium',
        title: 'Fix Compliance Issues',
        description: `${failedCompliance.length} compliance checks failed`,
        action: 'Review and fix container configuration',
        impact: 'Regulatory compliance risk',
        effort: 'low'
      });
    }

    return recommendations;
  }

  private async applyPolicyChecks(scanResult: ScanResult, policyId: string): Promise<void> {
    const policy = this.scanPolicies.get(policyId);
    if (!policy || !policy.enabled) return;

    const thresholds = policy.severityThresholds;
    let policyViolated = false;
    const violations: string[] = [];

    if (scanResult.summary.critical > thresholds.critical) {
      violations.push(`Critical vulnerabilities: ${scanResult.summary.critical} > ${thresholds.critical}`);
      policyViolated = true;
    }

    if (scanResult.summary.high > thresholds.high) {
      violations.push(`High vulnerabilities: ${scanResult.summary.high} > ${thresholds.high}`);
      policyViolated = true;
    }

    if (policyViolated) {
      this.emit('policyViolation', {
        scanId: scanResult.scanId,
        policyId,
        violations,
        imageName: scanResult.imageName,
        timestamp: new Date()
      });

      // Send notifications
      await this.sendPolicyNotifications(policy, scanResult, violations);
    }
  }

  private async sendPolicyNotifications(
    policy: ScanPolicy,
    scanResult: ScanResult,
    violations: string[]
  ): Promise<void> {
    for (const notification of policy.notifications) {
      try {
        await this.sendNotification(notification, {
          policyName: policy.name,
          imageName: scanResult.imageName,
          violations,
          scanResult
        });
      } catch (error) {
        this.emit('notificationError', {
          notificationType: notification.type,
          endpoint: notification.endpoint,
          error: error.message,
          timestamp: new Date()
        });
      }
    }
  }

  private async sendNotification(config: NotificationConfig, data: any): Promise<void> {
    // In production, implement actual notification sending
    console.log(`Sending ${config.type} notification to ${config.endpoint}:`, data);
  }

  private filterScanResults(
    timeRange: { start: Date; end: Date },
    filters?: any
  ): ScanResult[] {
    return Array.from(this.scanResults.values())
      .filter(result => {
        if (result.scanDate < timeRange.start || result.scanDate > timeRange.end) {
          return false;
        }
        
        if (filters?.severities && filters.severities.length > 0) {
          const hasSeverity = result.vulnerabilities.some(v => 
            filters.severities.includes(v.severity)
          );
          if (!hasSeverity) return false;
        }

        if (filters?.imagePatterns && filters.imagePatterns.length > 0) {
          const matchesPattern = filters.imagePatterns.some((pattern: string) =>
            result.imageName.includes(pattern)
          );
          if (!matchesPattern) return false;
        }

        return true;
      });
  }

  private generateTrends(results: ScanResult[], timeRange: { start: Date; end: Date }) {
    // Generate daily trends
    const trends = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    
    for (let d = new Date(timeRange.start); d <= timeRange.end; d.setTime(d.getTime() + msPerDay)) {
      const dayResults = results.filter(r => 
        r.scanDate.toDateString() === d.toDateString()
      );
      
      trends.push({
        date: new Date(d),
        scans: dayResults.length,
        vulnerabilities: dayResults.reduce((sum, r) => sum + r.summary.total, 0),
        riskScore: this.calculateOverallRiskScore(dayResults)
      });
    }

    return trends;
  }

  private getTopRiskyImages(results: ScanResult[], limit: number) {
    const imageRisks = new Map<string, any>();

    for (const result of results) {
      const imageName = result.imageName.split(':')[0];
      const riskScore = this.calculateRiskScore(result);
      
      if (!imageRisks.has(imageName) || imageRisks.get(imageName).riskScore < riskScore) {
        imageRisks.set(imageName, {
          imageName,
          riskScore,
          criticalCount: result.summary.critical,
          highCount: result.summary.high,
          lastScan: result.scanDate
        });
      }
    }

    return Array.from(imageRisks.values())
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);
  }

  private generateOverallRecommendations(results: ScanResult[]): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];
    
    const totalCritical = results.reduce((sum, r) => sum + r.summary.critical, 0);
    const totalHigh = results.reduce((sum, r) => sum + r.summary.high, 0);

    if (totalCritical > 0) {
      recommendations.push({
        type: 'policy_update',
        priority: 'critical',
        title: 'Implement Critical Vulnerability Policy',
        description: `${totalCritical} critical vulnerabilities across all images`,
        action: 'Create policy to block deployment of images with critical vulnerabilities',
        impact: 'Prevent critical security issues in production',
        effort: 'low'
      });
    }

    return recommendations;
  }

  private calculateRiskScore(result: ScanResult): number {
    const weights = { critical: 10, high: 5, medium: 2, low: 1, negligible: 0.1 };
    return (
      result.summary.critical * weights.critical +
      result.summary.high * weights.high +
      result.summary.medium * weights.medium +
      result.summary.low * weights.low +
      result.summary.negligible * weights.negligible
    );
  }

  private calculateOverallRiskScore(results: ScanResult[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + this.calculateRiskScore(r), 0) / results.length;
  }

  private getRandomSeverity(): 'critical' | 'high' | 'medium' | 'low' | 'negligible' {
    const severities = ['critical', 'high', 'medium', 'low', 'negligible'] as const;
    const weights = [0.05, 0.15, 0.3, 0.4, 0.1]; // Distribution weights
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        return severities[i];
      }
    }
    
    return 'low';
  }

  private getSeverityScore(severity: string): number {
    const scores = {
      critical: 10,
      high: 7.5,
      medium: 5,
      low: 2.5,
      negligible: 1
    };
    return scores[severity] || 0;
  }

  private initializeVulnerabilityDatabase(): void {
    // Initialize with common CVE patterns
    // In production, this would sync with vulnerability databases
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicy: Omit<ScanPolicy, 'id'> = {
      name: 'Production Security Policy',
      description: 'Standard security policy for production images',
      enabled: true,
      triggers: [
        { type: 'on_push', registries: ['production'] },
        { type: 'scheduled', schedule: '0 2 * * *' } // Daily at 2 AM
      ],
      severityThresholds: {
        critical: 0,
        high: 5,
        medium: 20,
        low: 50
      },
      complianceStandards: ['CIS', 'NIST', 'PCI_DSS'],
      notifications: [
        {
          type: 'email',
          endpoint: 'security-team@investment-platform.com',
          conditions: ['critical > 0', 'high > 5'],
          template: 'security-alert'
        }
      ]
    };

    this.createScanPolicy(defaultPolicy);
  }
}

export default ContainerSecurityScanner;
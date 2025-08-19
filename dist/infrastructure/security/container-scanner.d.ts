import { EventEmitter } from 'events';
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
    schedule?: string;
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
export declare class ContainerSecurityScanner extends EventEmitter {
    private scanResults;
    private scanPolicies;
    private knownVulnerabilities;
    private registryCredentials;
    constructor();
    /**
     * Scan container image for vulnerabilities
     */
    scanImage(imageName: string, tag?: string, options?: {
        registry?: string;
        policyId?: string;
        deepScan?: boolean;
        complianceChecks?: boolean;
    }): Promise<ScanResult>;
    /**
     * Scan multiple images in batch
     */
    batchScan(images: Array<{
        name: string;
        tag?: string;
        registry?: string;
    }>, options?: {
        policyId?: string;
        maxConcurrent?: number;
    }): Promise<ScanResult[]>;
    /**
     * Get scan result by ID
     */
    getScanResult(scanId: string): ScanResult | null;
    /**
     * Get scan history for image
     */
    getImageScanHistory(imageName: string, limit?: number): ScanResult[];
    /**
     * Create scan policy
     */
    createScanPolicy(policy: Omit<ScanPolicy, 'id'>): ScanPolicy;
    /**
     * Generate security report
     */
    generateSecurityReport(timeRange: {
        start: Date;
        end: Date;
    }, filters?: {
        registries?: string[];
        severities?: string[];
        imagePatterns?: string[];
    }): {
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
    };
    private getImageMetadata;
    private performVulnerabilityScan;
    private scanPackageManager;
    private scanConfiguration;
    private performComplianceChecks;
    private updateVulnerabilitySummary;
    private generateRecommendations;
    private applyPolicyChecks;
    private sendPolicyNotifications;
    private sendNotification;
    private filterScanResults;
    private generateTrends;
    private getTopRiskyImages;
    private generateOverallRecommendations;
    private calculateRiskScore;
    private calculateOverallRiskScore;
    private getRandomSeverity;
    private getSeverityScore;
    private initializeVulnerabilityDatabase;
    private initializeDefaultPolicies;
}
export default ContainerSecurityScanner;

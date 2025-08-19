#!/usr/bin/env ts-node
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
declare class SecurityAuditRunner {
    private options;
    private defaultConfig;
    constructor(options: SecurityCliOptions);
    run(): Promise<void>;
    private loadSecurityConfiguration;
    private executeSelectedAudit;
    private executeVulnerabilityOnlyAudit;
    private executePenetrationTestingOnly;
    private executeCodeSecurityReviewOnly;
    private executeComplianceAuditOnly;
    private executeConfigurationAuditOnly;
    private executeContinuousSecurityScan;
    private setupSecurityEventListeners;
    private displaySecuritySummary;
    private handleCriticalFindings;
    private createDefaultConfig;
    private getEnvironmentUrl;
    private generateFindingsSummary;
    private calculateRiskScore;
    private getRiskLevel;
    private sendSecurityAlert;
    private createEmergencyRemediationPlan;
    private performConfigurationAudit;
    private generateVulnerabilityRecommendations;
    private generatePenetrationTestRecommendations;
    private generateCodeSecurityRecommendations;
    private generateComplianceSummary;
    private generateComplianceRecommendations;
    private generateConfigurationRecommendations;
    private generateContinuousScanSummary;
    private generateContinuousMonitoringRecommendations;
    private showHelp;
    private sleep;
}
export { SecurityAuditRunner };

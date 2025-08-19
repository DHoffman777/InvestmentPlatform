import { EventEmitter } from 'events';
/**
 * Comprehensive Security Audit Framework
 * Investment Management Platform Security Assessment
 */
export interface SecurityAuditConfig {
    auditName: string;
    scope: SecurityScope;
    auditTypes: AuditType[];
    environment: AuditEnvironment;
    compliance: ComplianceFramework[];
    reporting: SecurityReportingConfig;
    scheduledScans: ScheduledScan[];
}
export interface SecurityScope {
    applications: string[];
    networks: string[];
    databases: string[];
    apis: string[];
    infrastructure: string[];
    thirdPartyServices: string[];
}
export type AuditType = 'vulnerability_assessment' | 'penetration_testing' | 'code_security_review' | 'configuration_audit' | 'access_control_audit' | 'data_protection_audit' | 'network_security_audit' | 'compliance_audit' | 'threat_modeling' | 'security_architecture_review';
export interface AuditEnvironment {
    name: string;
    baseUrl: string;
    credentials: AuditCredentials;
    networkRange: string[];
    excludedTargets: string[];
}
export interface AuditCredentials {
    apiKeys: Record<string, string>;
    testAccounts: TestAccount[];
    adminAccess: AdminCredentials;
}
export interface TestAccount {
    username: string;
    password: string;
    role: string;
    permissions: string[];
    mfaEnabled: boolean;
}
export interface AdminCredentials {
    username: string;
    password: string;
    sshKey?: string;
    accessToken?: string;
}
export type ComplianceFramework = 'SOC2' | 'PCI_DSS' | 'GDPR' | 'FINRA' | 'SEC' | 'ISO27001' | 'NIST_CSF' | 'OWASP_TOP10';
export interface SecurityReportingConfig {
    formats: ('pdf' | 'html' | 'json' | 'csv' | 'docx')[];
    outputDir: string;
    executiveSummary: boolean;
    technicalDetails: boolean;
    remediationPlan: boolean;
    complianceMapping: boolean;
}
export interface ScheduledScan {
    name: string;
    schedule: string;
    auditTypes: AuditType[];
    autoRemediate: boolean;
    alertThresholds: AlertThreshold[];
}
export interface AlertThreshold {
    severity: SecuritySeverity;
    count: number;
    timeWindow: number;
    escalation: EscalationRule[];
}
export interface EscalationRule {
    level: number;
    delay: number;
    recipients: string[];
    actions: string[];
}
export type SecuritySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export interface SecurityAuditResult {
    auditId: string;
    config: SecurityAuditConfig;
    startTime: Date;
    endTime: Date;
    duration: number;
    findings: SecurityFinding[];
    summary: SecuritySummary;
    complianceStatus: ComplianceStatus[];
    recommendations: SecurityRecommendation[];
    remediationPlan: RemediationItem[];
}
export interface SecurityFinding {
    id: string;
    title: string;
    description: string;
    severity: SecuritySeverity;
    category: SecurityCategory;
    location: FindingLocation;
    evidence: Evidence[];
    cve?: string;
    cvss?: CVSSScore;
    impact: SecurityImpact;
    remediation: string;
    references: string[];
    discoveryDate: Date;
    status: FindingStatus;
}
export type SecurityCategory = 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_PROTECTION' | 'INJECTION' | 'BROKEN_ACCESS_CONTROL' | 'SECURITY_MISCONFIGURATION' | 'VULNERABLE_COMPONENTS' | 'INSUFFICIENT_LOGGING' | 'CRYPTOGRAPHIC_FAILURES' | 'SERVER_SIDE_REQUEST_FORGERY' | 'INSECURE_DESIGN' | 'SOFTWARE_INTEGRITY_FAILURES';
export interface FindingLocation {
    component: string;
    url?: string;
    file?: string;
    line?: number;
    endpoint?: string;
    parameter?: string;
}
export interface Evidence {
    type: 'screenshot' | 'request_response' | 'log_entry' | 'code_snippet' | 'configuration';
    data: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface CVSSScore {
    version: string;
    vector: string;
    baseScore: number;
    temporalScore?: number;
    environmentalScore?: number;
}
export interface SecurityImpact {
    confidentiality: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    integrity: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    availability: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    businessImpact: string;
    affectedAssets: string[];
    exploitability: 'HIGH' | 'MEDIUM' | 'LOW';
}
export type FindingStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK' | 'FALSE_POSITIVE';
export interface SecuritySummary {
    totalFindings: number;
    findingsBySeverity: Record<SecuritySeverity, number>;
    findingsByCategory: Record<SecurityCategory, number>;
    riskScore: number;
    complianceScore: number;
    previousAuditComparison?: ComparisonMetrics;
}
export interface ComparisonMetrics {
    newFindings: number;
    resolvedFindings: number;
    riskScoreChange: number;
    improvementAreas: string[];
    regressionAreas: string[];
}
export interface ComplianceStatus {
    framework: ComplianceFramework;
    score: number;
    passed: number;
    failed: number;
    notApplicable: number;
    requirements: ComplianceRequirement[];
}
export interface ComplianceRequirement {
    id: string;
    description: string;
    status: 'PASS' | 'FAIL' | 'PARTIAL' | 'N/A';
    evidence: string[];
    gaps: string[];
}
export interface SecurityRecommendation {
    id: string;
    title: string;
    description: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    category: string;
    implementation: string[];
    timeline: string;
    cost: string;
}
export interface RemediationItem {
    findingId: string;
    title: string;
    description: string;
    priority: number;
    assignee: string;
    dueDate: Date;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED';
    dependencies: string[];
    resources: string[];
    testingRequired: boolean;
}
export declare class SecurityAuditFramework extends EventEmitter {
    private config;
    private auditId;
    private findings;
    private scanners;
    private vulnerabilityDatabase;
    constructor(config: SecurityAuditConfig);
    /**
     * Execute comprehensive security audit
     */
    executeSecurityAudit(): Promise<SecurityAuditResult>;
    /**
     * Execute vulnerability assessment
     */
    executeVulnerabilityAssessment(): Promise<SecurityFinding[]>;
    /**
     * Execute penetration testing
     */
    executePenetrationTesting(): Promise<SecurityFinding[]>;
    /**
     * Execute code security review
     */
    executeCodeSecurityReview(): Promise<SecurityFinding[]>;
    /**
     * Assess compliance against multiple frameworks
     */
    private assessCompliance;
    /**
     * Scan network vulnerabilities
     */
    private scanNetworkVulnerabilities;
    /**
     * Scan web application vulnerabilities
     */
    private scanWebApplicationVulnerabilities;
    /**
     * Scan database vulnerabilities
     */
    private scanDatabaseVulnerabilities;
    /**
     * Test authentication bypass vulnerabilities
     */
    private testAuthenticationBypass;
    /**
     * Test authorization vulnerabilities
     */
    private testAuthorization;
    /**
     * Generate security recommendations
     */
    private generateRecommendations;
    /**
     * Create detailed remediation plan
     */
    private createRemediationPlan;
    /**
     * Generate comprehensive security reports
     */
    private generateSecurityReports;
    private generateSecurityReport;
    private generateHTMLSecurityReport;
    private initializeScanners;
    private initializeAuditEnvironment;
    private executeSecurityScans;
    private generateSecuritySummary;
    private calculateRiskScore;
    private calculateComplianceScore;
    private mapCVSSToSeverity;
    private calculateRemediationDueDate;
    private assignRemediationOwner;
    private performPortScan;
    private scanOWASPTop10;
    private scanAuthenticationVulnerabilities;
    private scanSessionVulnerabilities;
    private scanInputValidationVulnerabilities;
    private assessDatabaseConfiguration;
    private reviewDatabaseAccessControl;
    private testSQLInjection;
    private assessDatabaseEncryption;
    private scanInfrastructureVulnerabilities;
    private scanAPIVulnerabilities;
    private testCredentialStuffing;
    private testBruteForceAttacks;
    private testPasswordReset;
    private testMultiFactorAuthentication;
    private testSessionFixation;
    private testJWTVulnerabilities;
    private testPrivilegeEscalation;
    private testInsecureDirectObjectReferences;
    private testRoleBasedAccessControl;
    private testAPIAuthorization;
    private testInputValidation;
    private testSessionManagement;
    private testBusinessLogic;
    private performStaticCodeAnalysis;
    private scanDependencyVulnerabilities;
    private detectHardcodedSecrets;
    private reviewCryptographicImplementation;
    private getComplianceAssessor;
    private identifyDependencies;
    private identifyRequiredResources;
    private generatePDFSecurityReport;
    private generateCSVSecurityReport;
}
export default SecurityAuditFramework;

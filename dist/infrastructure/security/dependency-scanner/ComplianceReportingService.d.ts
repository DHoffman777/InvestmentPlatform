import { EventEmitter } from 'events';
export interface ComplianceReport {
    id: string;
    tenantId: string;
    reportType: 'SECURITY_POSTURE' | 'VULNERABILITY_SUMMARY' | 'RISK_ASSESSMENT' | 'LICENSE_COMPLIANCE' | 'REGULATORY_COMPLIANCE' | 'EXECUTIVE_SUMMARY';
    title: string;
    description: string;
    generatedAt: Date;
    reportPeriod: {
        startDate: Date;
        endDate: Date;
    };
    scope: ReportScope;
    compliance: ComplianceStatus;
    findings: Finding[];
    metrics: ComplianceMetrics;
    recommendations: ReportRecommendation[];
    attachments: ReportAttachment[];
    distribution: ReportDistribution;
    nextReportDue?: Date;
    status: 'DRAFT' | 'FINAL' | 'DISTRIBUTED' | 'ARCHIVED';
    version: string;
    createdBy: string;
    approvedBy?: string;
    approvedAt?: Date;
}
export interface ReportScope {
    projects: string[];
    environments: string[];
    ecosystems: string[];
    includeTransitive: boolean;
    severityThreshold: string;
    dateRange: {
        from: Date;
        to: Date;
    };
}
export interface ComplianceStatus {
    overallScore: number;
    level: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
    frameworks: FrameworkCompliance[];
    policies: PolicyCompliance[];
    exceptions: ComplianceException[];
}
export interface FrameworkCompliance {
    framework: 'SOC2' | 'ISO27001' | 'NIST' | 'PCI_DSS' | 'GDPR' | 'FINRA' | 'SEC' | 'SOX';
    version: string;
    score: number;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'NOT_APPLICABLE';
    requirements: RequirementCompliance[];
    gaps: ComplianceGap[];
    lastAssessment: Date;
    nextAssessment: Date;
}
export interface RequirementCompliance {
    id: string;
    title: string;
    description: string;
    status: 'MET' | 'NOT_MET' | 'PARTIAL' | 'NOT_APPLICABLE';
    evidence: string[];
    gaps: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface PolicyCompliance {
    policyId: string;
    policyName: string;
    version: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
    violations: PolicyViolation[];
    exceptions: string[];
    lastReview: Date;
}
export interface PolicyViolation {
    id: string;
    type: 'VULNERABILITY' | 'LICENSE' | 'AGE' | 'MAINTENANCE' | 'CONFIGURATION';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    dependency: string;
    description: string;
    detectedAt: Date;
    status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ACCEPTED';
    assignedTo?: string;
    dueDate?: Date;
}
export interface ComplianceException {
    id: string;
    type: 'POLICY' | 'REQUIREMENT' | 'CONTROL';
    reference: string;
    reason: string;
    approvedBy: string;
    approvedAt: Date;
    expiresAt: Date;
    conditions: string[];
    review: {
        frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
        nextReview: Date;
        reviewer: string;
    };
}
export interface ComplianceGap {
    id: string;
    type: 'CONTROL' | 'PROCESS' | 'TECHNOLOGY' | 'DOCUMENTATION';
    title: string;
    description: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    effort: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    timeline: string;
    owner: string;
    status: 'IDENTIFIED' | 'PLANNED' | 'IN_PROGRESS' | 'RESOLVED';
}
export interface Finding {
    id: string;
    category: 'VULNERABILITY' | 'LICENSE' | 'POLICY' | 'RISK' | 'COMPLIANCE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    impact: string;
    recommendation: string;
    affectedDependencies: string[];
    evidence: FindingEvidence[];
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED';
    assignedTo?: string;
    dueDate?: Date;
    firstDetected: Date;
    lastSeen: Date;
}
export interface FindingEvidence {
    type: 'SCAN_RESULT' | 'LOG_ENTRY' | 'CONFIGURATION' | 'DOCUMENTATION';
    source: string;
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface ComplianceMetrics {
    security: SecurityMetrics;
    governance: GovernanceMetrics;
    operational: OperationalMetrics;
    trends: TrendMetrics;
}
export interface SecurityMetrics {
    totalVulnerabilities: number;
    vulnerabilitiesByseverity: Record<string, number>;
    meanTimeToRemediation: number;
    vulnerabilityAge: {
        new: number;
        aging: number;
        stale: number;
    };
    patchCoverage: number;
    securityScore: number;
}
export interface GovernanceMetrics {
    policyCompliance: number;
    exceptionsCount: number;
    approvalCoverage: number;
    documentationCoverage: number;
    reviewCoverage: number;
}
export interface OperationalMetrics {
    dependencyInventoryAccuracy: number;
    scanCoverage: number;
    automationLevel: number;
    alertResponseTime: number;
    incidentCount: number;
}
export interface TrendMetrics {
    vulnerabilityTrend: TrendData[];
    complianceTrend: TrendData[];
    riskTrend: TrendData[];
}
export interface TrendData {
    date: Date;
    value: number;
    change: number;
}
export interface ReportRecommendation {
    id: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'SECURITY' | 'PROCESS' | 'TECHNOLOGY' | 'GOVERNANCE';
    title: string;
    description: string;
    rationale: string;
    impact: string;
    effort: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    timeline: string;
    owner: string;
    dependencies: string[];
    success_criteria: string[];
}
export interface ReportAttachment {
    id: string;
    name: string;
    type: 'CSV' | 'JSON' | 'PDF' | 'XLSX';
    description: string;
    size: number;
    path: string;
    checksum: string;
    generatedAt: Date;
}
export interface ReportDistribution {
    recipients: ReportRecipient[];
    schedule: DistributionSchedule;
    channels: DistributionChannel[];
    notifications: NotificationRule[];
}
export interface ReportRecipient {
    id: string;
    name: string;
    email: string;
    role: string;
    level: 'EXECUTIVE' | 'MANAGEMENT' | 'OPERATIONAL' | 'TECHNICAL';
    preferences: {
        format: 'PDF' | 'HTML' | 'EMAIL';
        frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
        sections: string[];
    };
}
export interface DistributionSchedule {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    timezone: string;
    enabled: boolean;
}
export interface DistributionChannel {
    type: 'EMAIL' | 'SLACK' | 'TEAMS' | 'JIRA' | 'WEBHOOK';
    config: Record<string, any>;
    enabled: boolean;
}
export interface NotificationRule {
    trigger: 'CRITICAL_FINDING' | 'COMPLIANCE_VIOLATION' | 'THRESHOLD_BREACH' | 'SCHEDULED';
    condition: string;
    recipients: string[];
    channels: string[];
    template: string;
}
export interface ComplianceTemplate {
    id: string;
    name: string;
    description: string;
    type: string;
    framework: string;
    sections: TemplateSection[];
    variables: TemplateVariable[];
    formatting: TemplateFormatting;
    createdAt: Date;
    updatedAt: Date;
}
export interface TemplateSection {
    id: string;
    title: string;
    order: number;
    required: boolean;
    content: string;
    dataSource: string;
    charts: ChartDefinition[];
    tables: TableDefinition[];
}
export interface TemplateVariable {
    name: string;
    type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN';
    defaultValue?: any;
    required: boolean;
    description: string;
}
export interface TemplateFormatting {
    theme: string;
    colors: Record<string, string>;
    fonts: Record<string, string>;
    layout: string;
    branding: {
        logo?: string;
        company: string;
        footer: string;
    };
}
export interface ChartDefinition {
    type: 'LINE' | 'BAR' | 'PIE' | 'DONUT' | 'GAUGE' | 'HEATMAP';
    title: string;
    dataSource: string;
    config: Record<string, any>;
}
export interface TableDefinition {
    title: string;
    columns: TableColumn[];
    dataSource: string;
    pagination: boolean;
    sorting: boolean;
    filtering: boolean;
}
export interface TableColumn {
    key: string;
    header: string;
    type: 'STRING' | 'NUMBER' | 'DATE' | 'STATUS' | 'LINK';
    sortable: boolean;
    filterable: boolean;
    format?: string;
}
export declare class ComplianceReportingService extends EventEmitter {
    private reports;
    private templates;
    private scheduledReports;
    constructor();
    private initializeDefaultTemplates;
    generateReport(tenantId: string, reportType: string, scope: ReportScope, templateId?: string, options?: {
        includeRawData?: boolean;
        generateAttachments?: boolean;
        autoDistribute?: boolean;
    }): Promise<ComplianceReport>;
    private gatherReportData;
    private mockDependencies;
    private mockVulnerabilities;
    private mockScanReports;
    private mockRiskAssessments;
    private mockPolicies;
    private mockExceptions;
    private analyzeCompliance;
    private analyzeFrameworkCompliance;
    private analyzePolicyCompliance;
    private calculateOverallComplianceScore;
    private determineComplianceLevel;
    private generateFindings;
    private calculateMetrics;
    private generateMockTrend;
    private generateRecommendations;
    private generateAttachments;
    private generateVulnerabilityCsv;
    private calculateChecksum;
    private generateReportTitle;
    private generateReportDescription;
    private getDefaultDistribution;
    private distributeReport;
    private sendEmailReport;
    private sendSlackReport;
    private sendTeamsReport;
    private sendWebhookReport;
    private generateReportId;
    private generateFindingId;
    private generateRecommendationId;
    private generateAttachmentId;
    getReport(reportId: string): ComplianceReport | undefined;
    getReportsByTenant(tenantId: string): ComplianceReport[];
    scheduleReport(tenantId: string, templateId: string, schedule: DistributionSchedule, scope: ReportScope): Promise<string>;
    private scheduleToyCron;
    private setupCronJob;
    unschedulereReport(scheduleId: string): boolean;
    approveReport(reportId: string, approver: string): boolean;
    getComplianceMetrics(tenantId?: string): any;
    private getReportTypeDistribution;
}

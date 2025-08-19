"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceReportingService = void 0;
const events_1 = require("events");
class ComplianceReportingService extends events_1.EventEmitter {
    reports = new Map();
    templates = new Map();
    scheduledReports = new Map();
    constructor() {
        super();
        this.initializeDefaultTemplates();
    }
    initializeDefaultTemplates() {
        // SOC 2 Template
        this.templates.set('soc2-security', {
            id: 'soc2-security',
            name: 'SOC 2 Type II Security Report',
            description: 'Comprehensive security compliance report for SOC 2 Type II requirements',
            type: 'REGULATORY_COMPLIANCE',
            framework: 'SOC2',
            sections: [
                {
                    id: 'executive-summary',
                    title: 'Executive Summary',
                    order: 1,
                    required: true,
                    content: 'High-level overview of security posture and compliance status',
                    dataSource: 'compliance_summary',
                    charts: [
                        {
                            type: 'GAUGE',
                            title: 'Overall Compliance Score',
                            dataSource: 'compliance_score',
                            config: { min: 0, max: 100, target: 95 }
                        }
                    ],
                    tables: []
                },
                {
                    id: 'vulnerability-analysis',
                    title: 'Vulnerability Management',
                    order: 2,
                    required: true,
                    content: 'Analysis of identified vulnerabilities and remediation status',
                    dataSource: 'vulnerabilities',
                    charts: [
                        {
                            type: 'BAR',
                            title: 'Vulnerabilities by Severity',
                            dataSource: 'vulnerability_severity',
                            config: { horizontal: false }
                        }
                    ],
                    tables: [
                        {
                            title: 'Critical Vulnerabilities',
                            columns: [
                                { key: 'dependency', header: 'Dependency', type: 'STRING', sortable: true, filterable: true },
                                { key: 'cve', header: 'CVE', type: 'LINK', sortable: false, filterable: false },
                                { key: 'severity', header: 'Severity', type: 'STATUS', sortable: true, filterable: true },
                                { key: 'age', header: 'Age (Days)', type: 'NUMBER', sortable: true, filterable: false }
                            ],
                            dataSource: 'critical_vulnerabilities',
                            pagination: true,
                            sorting: true,
                            filtering: true
                        }
                    ]
                }
            ],
            variables: [
                { name: 'report_period', type: 'STRING', required: true, description: 'Reporting period' },
                { name: 'auditor_name', type: 'STRING', required: true, description: 'Auditor name' }
            ],
            formatting: {
                theme: 'professional',
                colors: { primary: '#1f4e79', secondary: '#70ad47', accent: '#c55a5a' },
                fonts: { heading: 'Arial', body: 'Calibri' },
                layout: 'portrait',
                branding: {
                    company: 'Investment Platform',
                    footer: 'Confidential - For Internal Use Only'
                }
            },
            createdAt: new Date(),
            updatedAt: new Date()
        });
        // Executive Summary Template
        this.templates.set('executive-summary', {
            id: 'executive-summary',
            name: 'Executive Security Dashboard',
            description: 'High-level security metrics for executive leadership',
            type: 'EXECUTIVE_SUMMARY',
            framework: 'GENERAL',
            sections: [
                {
                    id: 'security-overview',
                    title: 'Security Overview',
                    order: 1,
                    required: true,
                    content: 'Current security posture and key metrics',
                    dataSource: 'security_overview',
                    charts: [
                        {
                            type: 'DONUT',
                            title: 'Risk Distribution',
                            dataSource: 'risk_distribution',
                            config: { showLabels: true }
                        },
                        {
                            type: 'LINE',
                            title: 'Security Trend (90 days)',
                            dataSource: 'security_trend',
                            config: { showDataPoints: true }
                        }
                    ],
                    tables: []
                }
            ],
            variables: [],
            formatting: {
                theme: 'executive',
                colors: { primary: '#2e5984', secondary: '#8fbc8f', accent: '#cd5c5c' },
                fonts: { heading: 'Segoe UI', body: 'Segoe UI' },
                layout: 'landscape',
                branding: {
                    company: 'Investment Platform',
                    footer: 'Executive Summary - Confidential'
                }
            },
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    async generateReport(tenantId, reportType, scope, templateId, options = {}) {
        const reportId = this.generateReportId();
        try {
            this.emit('reportGenerationStarted', { reportId, tenantId, reportType });
            // Gather data for the report
            const reportData = await this.gatherReportData(tenantId, scope);
            // Analyze compliance status
            const compliance = await this.analyzeCompliance(reportData, scope);
            // Generate findings
            const findings = await this.generateFindings(reportData, compliance);
            // Calculate metrics
            const metrics = await this.calculateMetrics(reportData, scope);
            // Generate recommendations
            const recommendations = await this.generateRecommendations(findings, metrics);
            // Create attachments if requested
            const attachments = [];
            if (options.generateAttachments) {
                attachments.push(...await this.generateAttachments(reportData, reportId));
            }
            const report = {
                id: reportId,
                tenantId,
                reportType: reportType,
                title: this.generateReportTitle(reportType, scope),
                description: this.generateReportDescription(reportType, scope),
                generatedAt: new Date(),
                reportPeriod: {
                    startDate: scope.dateRange.from,
                    endDate: scope.dateRange.to
                },
                scope,
                compliance,
                findings,
                metrics,
                recommendations,
                attachments,
                distribution: this.getDefaultDistribution(tenantId),
                status: 'DRAFT',
                version: '1.0.0',
                createdBy: 'system'
            };
            this.reports.set(reportId, report);
            if (options.autoDistribute) {
                await this.distributeReport(reportId);
            }
            this.emit('reportGenerated', {
                reportId,
                tenantId,
                reportType,
                findingsCount: findings.length,
                complianceScore: compliance.overallScore
            });
            return report;
        }
        catch (error) {
            this.emit('reportGenerationFailed', { reportId, tenantId, error: error.message });
            throw error;
        }
    }
    async gatherReportData(tenantId, scope) {
        // Mock implementation - would gather data from various services
        return {
            dependencies: this.mockDependencies(scope),
            vulnerabilities: this.mockVulnerabilities(scope),
            scanReports: this.mockScanReports(scope),
            riskAssessments: this.mockRiskAssessments(scope),
            policies: this.mockPolicies(tenantId),
            exceptions: this.mockExceptions(tenantId)
        };
    }
    mockDependencies(scope) {
        // Mock dependencies data
        return [
            {
                name: 'lodash',
                version: '4.17.20',
                type: 'direct',
                scope: 'production',
                ecosystem: 'npm',
                packageFile: 'package.json',
                licenses: ['MIT'],
                dependsOn: [],
                dependedOnBy: []
            },
            {
                name: 'moment',
                version: '2.29.1',
                type: 'direct',
                scope: 'production',
                ecosystem: 'npm',
                packageFile: 'package.json',
                licenses: ['MIT'],
                dependsOn: [],
                dependedOnBy: []
            }
        ];
    }
    mockVulnerabilities(scope) {
        // Mock vulnerabilities data
        return [
            {
                vulnerability: {
                    id: 'CVE-2023-1234',
                    cve: 'CVE-2023-1234',
                    title: 'Cross-site scripting vulnerability',
                    description: 'Improper input validation allows XSS attacks',
                    severity: 'HIGH',
                    cvssScore: 7.5,
                    packageName: 'lodash',
                    ecosystem: 'npm',
                    affectedVersions: [{ operator: '<', version: '4.17.21' }],
                    patchedVersions: [{ operator: '>=', version: '4.17.21' }],
                    publishedAt: new Date('2023-01-15'),
                    updatedAt: new Date('2023-01-20'),
                    references: [],
                    advisories: [],
                    fixAvailable: true,
                    dataSource: 'NVD',
                    lastChecked: new Date()
                },
                dependency: {
                    name: 'lodash',
                    version: '4.17.20',
                    type: 'direct',
                    scope: 'production',
                    ecosystem: 'npm',
                    packageFile: 'package.json',
                    licenses: ['MIT'],
                    dependsOn: [],
                    dependedOnBy: []
                },
                matchType: 'VERSION_RANGE',
                confidence: 95,
                matchedVersion: '4.17.20',
                fixAvailable: true,
                recommendedAction: 'UPDATE',
                context: {
                    directImpact: true
                }
            }
        ];
    }
    mockScanReports(scope) {
        return [{
                scanId: 'scan_123',
                inventoryId: 'inv_456',
                totalDependencies: 150,
                vulnerableDependencies: 12,
                totalVulnerabilities: 18,
                severityBreakdown: { CRITICAL: 2, HIGH: 5, MEDIUM: 8, LOW: 3 },
                matches: [],
                scanDuration: 45000,
                completedAt: new Date(),
                databasesUsed: ['OSV', 'NVD'],
                errors: []
            }];
    }
    mockRiskAssessments(scope) {
        return [{
                id: 'risk_789',
                dependencyId: 'lodash@4.17.20',
                tenantId: 'tenant_123',
                assessmentDate: new Date(),
                overallRiskScore: 75,
                riskLevel: 'HIGH',
                riskFactors: [],
                businessImpactScore: 70,
                technicalRiskScore: 80,
                exploitabilityScore: 75,
                environmentalScore: 85,
                mitigationStrategies: [],
                priority: 85,
                assessedBy: 'system',
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                lastUpdated: new Date()
            }];
    }
    mockPolicies(tenantId) {
        return [{
                policyId: 'SEC-001',
                policyName: 'Security Vulnerability Management',
                version: '2.1',
                status: 'COMPLIANT',
                violations: [],
                exceptions: [],
                lastReview: new Date()
            }];
    }
    mockExceptions(tenantId) {
        return [{
                id: 'exc_001',
                type: 'POLICY',
                reference: 'SEC-001',
                reason: 'Legacy system compatibility',
                approvedBy: 'security_team',
                approvedAt: new Date('2023-01-01'),
                expiresAt: new Date('2024-01-01'),
                conditions: ['Regular security monitoring'],
                review: {
                    frequency: 'QUARTERLY',
                    nextReview: new Date('2024-04-01'),
                    reviewer: 'security_team'
                }
            }];
    }
    async analyzeCompliance(reportData, scope) {
        const frameworks = await this.analyzeFrameworkCompliance(reportData);
        const policies = await this.analyzePolicyCompliance(reportData);
        const exceptions = reportData.exceptions || [];
        const overallScore = this.calculateOverallComplianceScore(frameworks, policies);
        const level = this.determineComplianceLevel(overallScore);
        return {
            overallScore,
            level,
            frameworks,
            policies,
            exceptions
        };
    }
    async analyzeFrameworkCompliance(reportData) {
        // Mock SOC 2 compliance analysis
        return [{
                framework: 'SOC2',
                version: 'Type II',
                score: 87,
                status: 'COMPLIANT',
                requirements: [
                    {
                        id: 'CC6.1',
                        title: 'Vulnerability Management',
                        description: 'System vulnerabilities are identified and managed',
                        status: 'MET',
                        evidence: ['Automated vulnerability scanning', 'Regular security updates'],
                        gaps: [],
                        riskLevel: 'LOW'
                    },
                    {
                        id: 'CC6.2',
                        title: 'Security Configuration',
                        description: 'Systems are configured securely',
                        status: 'PARTIAL',
                        evidence: ['Configuration management'],
                        gaps: ['Some legacy systems not fully hardened'],
                        riskLevel: 'MEDIUM'
                    }
                ],
                gaps: [{
                        id: 'gap_001',
                        type: 'PROCESS',
                        title: 'Legacy System Hardening',
                        description: 'Some legacy systems require additional hardening',
                        impact: 'MEDIUM',
                        effort: 'HIGH',
                        timeline: '6 months',
                        owner: 'security_team',
                        status: 'PLANNED'
                    }],
                lastAssessment: new Date(),
                nextAssessment: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }];
    }
    async analyzePolicyCompliance(reportData) {
        const vulnerabilities = reportData.vulnerabilities || [];
        const highSeverityCount = vulnerabilities.filter(v => v.vulnerability.severity === 'CRITICAL' || v.vulnerability.severity === 'HIGH').length;
        const violations = [];
        if (highSeverityCount > 0) {
            violations.push({
                id: 'viol_001',
                type: 'VULNERABILITY',
                severity: 'HIGH',
                dependency: 'lodash',
                description: `${highSeverityCount} high-severity vulnerabilities detected`,
                detectedAt: new Date(),
                status: 'OPEN'
            });
        }
        return [{
                policyId: 'SEC-001',
                policyName: 'Security Vulnerability Management',
                version: '2.1',
                status: violations.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
                violations,
                exceptions: [],
                lastReview: new Date()
            }];
    }
    calculateOverallComplianceScore(frameworks, policies) {
        const frameworkScore = frameworks.reduce((sum, f) => sum + f.score, 0) / Math.max(1, frameworks.length);
        const policyScore = policies.reduce((sum, p) => {
            const score = p.status === 'COMPLIANT' ? 100 : p.status === 'PARTIAL' ? 50 : 0;
            return sum + score;
        }, 0) / Math.max(1, policies.length);
        return Math.round((frameworkScore * 0.6) + (policyScore * 0.4));
    }
    determineComplianceLevel(score) {
        if (score >= 95)
            return 'EXCELLENT';
        if (score >= 85)
            return 'GOOD';
        if (score >= 70)
            return 'FAIR';
        if (score >= 50)
            return 'POOR';
        return 'CRITICAL';
    }
    async generateFindings(reportData, compliance) {
        const findings = [];
        const vulnerabilities = reportData.vulnerabilities || [];
        // Generate vulnerability findings
        for (const vulnMatch of vulnerabilities) {
            if (vulnMatch.vulnerability.severity === 'CRITICAL' || vulnMatch.vulnerability.severity === 'HIGH') {
                findings.push({
                    id: this.generateFindingId(),
                    category: 'VULNERABILITY',
                    severity: vulnMatch.vulnerability.severity,
                    title: `${vulnMatch.vulnerability.severity} severity vulnerability in ${vulnMatch.dependency.name}`,
                    description: vulnMatch.vulnerability.description,
                    impact: `Potential security risk to application functionality`,
                    recommendation: vulnMatch.fixAvailable ? 'Update to patched version' : 'Apply workaround or replace dependency',
                    affectedDependencies: [vulnMatch.dependency.name],
                    evidence: [{
                            type: 'SCAN_RESULT',
                            source: vulnMatch.vulnerability.dataSource,
                            content: `CVE: ${vulnMatch.vulnerability.cve}, CVSS: ${vulnMatch.vulnerability.cvssScore}`,
                            timestamp: new Date()
                        }],
                    status: 'OPEN',
                    firstDetected: new Date(),
                    lastSeen: new Date()
                });
            }
        }
        // Generate compliance findings
        for (const framework of compliance.frameworks) {
            for (const gap of framework.gaps) {
                findings.push({
                    id: this.generateFindingId(),
                    category: 'COMPLIANCE',
                    severity: gap.impact,
                    title: gap.title,
                    description: gap.description,
                    impact: `Non-compliance with ${framework.framework} requirements`,
                    recommendation: `Address ${gap.type.toLowerCase()} gap within ${gap.timeline}`,
                    affectedDependencies: [],
                    evidence: [{
                            type: 'DOCUMENTATION',
                            source: framework.framework,
                            content: `Gap identified in ${framework.framework} assessment`,
                            timestamp: new Date()
                        }],
                    status: gap.status === 'RESOLVED' ? 'RESOLVED' : 'OPEN',
                    firstDetected: new Date(),
                    lastSeen: new Date()
                });
            }
        }
        return findings;
    }
    async calculateMetrics(reportData, scope) {
        const vulnerabilities = reportData.vulnerabilities || [];
        const scanReports = reportData.scanReports || [];
        // Security metrics
        const totalVulns = vulnerabilities.length;
        const vulnerabilitiesByService = vulnerabilities.reduce((acc, v) => {
            const severity = v.vulnerability.severity;
            acc[severity] = (acc[severity] || 0) + 1;
            return acc;
        }, {});
        const security = {
            totalVulnerabilities: totalVulns,
            vulnerabilitiesByService,
            meanTimeToRemediation: 7, // Mock data
            vulnerabilityAge: {
                new: Math.floor(totalVulns * 0.3),
                aging: Math.floor(totalVulns * 0.5),
                stale: Math.floor(totalVulns * 0.2)
            },
            patchCoverage: 85,
            securityScore: 78
        };
        // Governance metrics
        const governance = {
            policyCompliance: 87,
            exceptionsCount: reportData.exceptions?.length || 0,
            approvalCoverage: 92,
            documentationCoverage: 88,
            reviewCoverage: 95
        };
        // Operational metrics
        const operational = {
            dependencyInventoryAccuracy: 95,
            scanCoverage: 98,
            automationLevel: 85,
            alertResponseTime: 2.5,
            incidentCount: 3
        };
        // Trend metrics (mock data)
        const trends = {
            vulnerabilityTrend: this.generateMockTrend(30, 20, 5),
            complianceTrend: this.generateMockTrend(85, 90, 2),
            riskTrend: this.generateMockTrend(40, 35, 3)
        };
        return {
            security,
            governance,
            operational,
            trends
        };
    }
    generateMockTrend(start, end, days) {
        const trend = [];
        const step = (end - start) / days;
        for (let i = 0; i <= days; i++) {
            const date = new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000);
            const value = Math.round(start + (step * i) + (Math.random() * 5 - 2.5));
            const change = i > 0 ? value - trend[i - 1].value : 0;
            trend.push({ date, value, change });
        }
        return trend;
    }
    async generateRecommendations(findings, metrics) {
        const recommendations = [];
        // High-priority security recommendations
        const criticalFindings = findings.filter(f => f.severity === 'CRITICAL');
        if (criticalFindings.length > 0) {
            recommendations.push({
                id: this.generateRecommendationId(),
                priority: 'HIGH',
                category: 'SECURITY',
                title: 'Address Critical Security Vulnerabilities',
                description: `${criticalFindings.length} critical vulnerabilities require immediate attention`,
                rationale: 'Critical vulnerabilities pose significant security risks',
                impact: 'Reduces security risk exposure',
                effort: 'MEDIUM',
                timeline: '1-2 weeks',
                owner: 'security_team',
                dependencies: [],
                success_criteria: ['All critical vulnerabilities resolved', 'Security scan passes']
            });
        }
        // Compliance recommendations
        if (metrics.governance.policyCompliance < 90) {
            recommendations.push({
                id: this.generateRecommendationId(),
                priority: 'MEDIUM',
                category: 'GOVERNANCE',
                title: 'Improve Policy Compliance',
                description: 'Enhance compliance with security policies and procedures',
                rationale: `Current compliance score is ${metrics.governance.policyCompliance}%, below target of 90%`,
                impact: 'Improves overall security posture',
                effort: 'HIGH',
                timeline: '1-3 months',
                owner: 'compliance_team',
                dependencies: ['Policy review', 'Training program'],
                success_criteria: ['Policy compliance above 90%', 'All team members trained']
            });
        }
        // Operational recommendations
        if (metrics.operational.automationLevel < 80) {
            recommendations.push({
                id: this.generateRecommendationId(),
                priority: 'LOW',
                category: 'TECHNOLOGY',
                title: 'Increase Security Automation',
                description: 'Implement additional automation for security processes',
                rationale: `Current automation level is ${metrics.operational.automationLevel}%, target is 80%+`,
                impact: 'Reduces manual effort and improves consistency',
                effort: 'MEDIUM',
                timeline: '2-4 months',
                owner: 'devops_team',
                dependencies: ['Tool evaluation', 'Integration planning'],
                success_criteria: ['Automation level above 80%', 'Reduced manual intervention']
            });
        }
        return recommendations.sort((a, b) => {
            const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    async generateAttachments(reportData, reportId) {
        const attachments = [];
        // Generate CSV export of vulnerabilities
        const vulnCsv = this.generateVulnerabilityCsv(reportData.vulnerabilities || []);
        attachments.push({
            id: this.generateAttachmentId(),
            name: 'vulnerabilities.csv',
            type: 'CSV',
            description: 'Complete list of identified vulnerabilities',
            size: vulnCsv.length,
            path: `/reports/${reportId}/vulnerabilities.csv`,
            checksum: this.calculateChecksum(vulnCsv),
            generatedAt: new Date()
        });
        // Generate JSON export of scan results
        const scanJson = JSON.stringify(reportData.scanReports || [], null, 2);
        attachments.push({
            id: this.generateAttachmentId(),
            name: 'scan_results.json',
            type: 'JSON',
            description: 'Raw scan results and metadata',
            size: scanJson.length,
            path: `/reports/${reportId}/scan_results.json`,
            checksum: this.calculateChecksum(scanJson),
            generatedAt: new Date()
        });
        return attachments;
    }
    generateVulnerabilityCsv(vulnerabilities) {
        const headers = ['Dependency', 'Version', 'CVE', 'Severity', 'CVSS Score', 'Description', 'Fix Available'];
        const rows = vulnerabilities.map(v => [
            v.dependency.name,
            v.dependency.version,
            v.vulnerability.cve || 'N/A',
            v.vulnerability.severity,
            v.vulnerability.cvssScore?.toString() || 'N/A',
            `"${v.vulnerability.description.replace(/"/g, '""')}"`,
            v.fixAvailable ? 'Yes' : 'No'
        ]);
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    calculateChecksum(content) {
        // Simple checksum calculation
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }
    generateReportTitle(reportType, scope) {
        const typeNames = {
            'SECURITY_POSTURE': 'Security Posture Report',
            'VULNERABILITY_SUMMARY': 'Vulnerability Summary Report',
            'RISK_ASSESSMENT': 'Risk Assessment Report',
            'LICENSE_COMPLIANCE': 'License Compliance Report',
            'REGULATORY_COMPLIANCE': 'Regulatory Compliance Report',
            'EXECUTIVE_SUMMARY': 'Executive Security Summary'
        };
        const baseName = typeNames[reportType] || 'Compliance Report';
        const dateRange = `${scope.dateRange.from.toISOString().split('T')[0]} to ${scope.dateRange.to.toISOString().split('T')[0]}`;
        return `${baseName} (${dateRange})`;
    }
    generateReportDescription(reportType, scope) {
        const descriptions = {
            'SECURITY_POSTURE': 'Comprehensive analysis of current security posture including vulnerabilities, compliance status, and risk assessment',
            'VULNERABILITY_SUMMARY': 'Summary of identified security vulnerabilities across all dependencies and systems',
            'RISK_ASSESSMENT': 'Detailed risk assessment of security threats and mitigation strategies',
            'LICENSE_COMPLIANCE': 'Analysis of open source license compliance and potential legal risks',
            'REGULATORY_COMPLIANCE': 'Assessment of compliance with regulatory requirements and industry standards',
            'EXECUTIVE_SUMMARY': 'High-level overview of security metrics and key performance indicators'
        };
        return descriptions[reportType] || 'Security and compliance analysis report';
    }
    getDefaultDistribution(tenantId) {
        return {
            recipients: [
                {
                    id: 'exec_001',
                    name: 'Security Executive',
                    email: 'security@company.com',
                    role: 'CISO',
                    level: 'EXECUTIVE',
                    preferences: {
                        format: 'PDF',
                        frequency: 'MONTHLY',
                        sections: ['executive-summary', 'key-metrics']
                    }
                }
            ],
            schedule: {
                frequency: 'MONTHLY',
                dayOfMonth: 1,
                time: '09:00',
                timezone: 'UTC',
                enabled: true
            },
            channels: [
                {
                    type: 'EMAIL',
                    config: { template: 'default' },
                    enabled: true
                }
            ],
            notifications: [
                {
                    trigger: 'CRITICAL_FINDING',
                    condition: 'severity = CRITICAL',
                    recipients: ['security_team'],
                    channels: ['EMAIL', 'SLACK'],
                    template: 'critical_alert'
                }
            ]
        };
    }
    async distributeReport(reportId) {
        const report = this.reports.get(reportId);
        if (!report)
            return;
        try {
            for (const channel of report.distribution.channels) {
                if (!channel.enabled)
                    continue;
                switch (channel.type) {
                    case 'EMAIL':
                        await this.sendEmailReport(report, channel.config);
                        break;
                    case 'SLACK':
                        await this.sendSlackReport(report, channel.config);
                        break;
                    case 'TEAMS':
                        await this.sendTeamsReport(report, channel.config);
                        break;
                    case 'WEBHOOK':
                        await this.sendWebhookReport(report, channel.config);
                        break;
                }
            }
            report.status = 'DISTRIBUTED';
            this.reports.set(reportId, report);
            this.emit('reportDistributed', { reportId, channels: report.distribution.channels.length });
        }
        catch (error) {
            this.emit('reportDistributionFailed', { reportId, error: error.message });
            throw error;
        }
    }
    async sendEmailReport(report, config) {
        // Email distribution implementation
        console.log(`Email report sent: ${report.title}`);
    }
    async sendSlackReport(report, config) {
        // Slack distribution implementation
        console.log(`Slack report sent: ${report.title}`);
    }
    async sendTeamsReport(report, config) {
        // Teams distribution implementation
        console.log(`Teams report sent: ${report.title}`);
    }
    async sendWebhookReport(report, config) {
        // Webhook distribution implementation
        console.log(`Webhook report sent: ${report.title}`);
    }
    // ID generators
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateFindingId() {
        return `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateRecommendationId() {
        return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateAttachmentId() {
        return `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Public API methods
    getReport(reportId) {
        return this.reports.get(reportId);
    }
    getReportsByTenant(tenantId) {
        return Array.from(this.reports.values())
            .filter(r => r.tenantId === tenantId)
            .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    }
    async scheduleReport(tenantId, templateId, schedule, scope) {
        const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const cronExpression = this.scheduleToyCron(schedule);
        const timeout = this.setupCronJob(cronExpression, async () => {
            await this.generateReport(tenantId, templateId, scope, templateId, { autoDistribute: true });
        });
        this.scheduledReports.set(scheduleId, timeout);
        this.emit('reportScheduled', { scheduleId, tenantId, frequency: schedule.frequency });
        return scheduleId;
    }
    scheduleToyCron(schedule) {
        const [hour, minute] = schedule.time.split(':').map(Number);
        switch (schedule.frequency) {
            case 'DAILY':
                return `${minute} ${hour} * * *`;
            case 'WEEKLY':
                return `${minute} ${hour} * * ${schedule.dayOfWeek || 1}`;
            case 'MONTHLY':
                return `${minute} ${hour} ${schedule.dayOfMonth || 1} * *`;
            case 'QUARTERLY':
                return `${minute} ${hour} 1 */3 *`;
            case 'ANNUALLY':
                return `${minute} ${hour} 1 1 *`;
            default:
                return `${minute} ${hour} * * *`;
        }
    }
    setupCronJob(cronExpression, callback) {
        // Simplified cron implementation - would use proper cron library
        return setTimeout(callback, 24 * 60 * 60 * 1000); // Daily for demo
    }
    unschedulereReport(scheduleId) {
        const timeout = this.scheduledReports.get(scheduleId);
        if (timeout) {
            clearTimeout(timeout);
            this.scheduledReports.delete(scheduleId);
            this.emit('reportUnscheduled', { scheduleId });
            return true;
        }
        return false;
    }
    approveReport(reportId, approver) {
        const report = this.reports.get(reportId);
        if (!report || report.status !== 'DRAFT')
            return false;
        report.status = 'FINAL';
        report.approvedBy = approver;
        report.approvedAt = new Date();
        this.reports.set(reportId, report);
        this.emit('reportApproved', { reportId, approver });
        return true;
    }
    getComplianceMetrics(tenantId) {
        const reports = tenantId
            ? this.getReportsByTenant(tenantId)
            : Array.from(this.reports.values());
        const recentReports = reports.filter(r => (Date.now() - r.generatedAt.getTime()) <= 30 * 24 * 60 * 60 * 1000);
        const avgComplianceScore = recentReports.reduce((sum, r) => sum + r.compliance.overallScore, 0) / Math.max(1, recentReports.length);
        const totalFindings = recentReports.reduce((sum, r) => sum + r.findings.length, 0);
        const criticalFindings = recentReports.reduce((sum, r) => sum + r.findings.filter(f => f.severity === 'CRITICAL').length, 0);
        return {
            totalReports: reports.length,
            recentReports: recentReports.length,
            avgComplianceScore: Math.round(avgComplianceScore),
            totalFindings,
            criticalFindings,
            scheduledReports: this.scheduledReports.size,
            reportTypes: this.getReportTypeDistribution(reports)
        };
    }
    getReportTypeDistribution(reports) {
        return reports.reduce((acc, report) => {
            acc[report.reportType] = (acc[report.reportType] || 0) + 1;
            return acc;
        }, {});
    }
}
exports.ComplianceReportingService = ComplianceReportingService;

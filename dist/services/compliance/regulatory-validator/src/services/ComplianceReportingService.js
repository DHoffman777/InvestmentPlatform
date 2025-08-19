"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceReportingService = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class ComplianceReportingService extends events_1.EventEmitter {
    config;
    auditService;
    ruleEngine;
    constructor(config, auditService, ruleEngine) {
        super();
        this.config = config;
        this.auditService = auditService;
        this.ruleEngine = ruleEngine;
    }
    async generateComplianceReport(reportType, title, description, period, scope, customSections) {
        const reportId = this.generateReportId(reportType);
        console.log(`Generating ${reportType} compliance report: ${reportId}`);
        // Collect base metrics
        const metrics = await this.auditService.getComplianceMetrics(period.startDate, period.endDate);
        // Get audit trail for the period
        const auditTrails = await this.auditService.getAuditTrail(undefined, undefined, 'VALIDATION', period.startDate, period.endDate, 5000);
        // Get open alerts
        const openAlerts = await this.auditService.getOpenAlerts();
        const periodAlerts = openAlerts.filter(alert => alert.timestamp >= period.startDate && alert.timestamp <= period.endDate);
        // Get rule performance metrics
        const ruleMetrics = this.ruleEngine.getPerformanceMetrics();
        // Generate report sections
        const sections = await this.generateReportSections(reportType, metrics, auditTrails, periodAlerts, ruleMetrics, period, scope, customSections);
        // Generate recommendations
        const recommendations = await this.generateRecommendations(metrics, auditTrails, periodAlerts, ruleMetrics);
        const report = {
            id: reportId,
            reportType,
            title,
            description,
            generatedAt: new Date(),
            period,
            scope,
            summary: {
                totalEntitiesReviewed: this.calculateTotalEntities(auditTrails),
                compliantEntities: this.calculateCompliantEntities(auditTrails),
                nonCompliantEntities: this.calculateNonCompliantEntities(auditTrails),
                exceptionsGranted: await this.getActiveExceptionsCount(),
                criticalViolations: metrics.criticalViolations,
                overallComplianceRate: metrics.complianceRate,
            },
            sections,
            recommendations,
            nextReviewDate: this.calculateNextReviewDate(reportType),
            distribution: {
                recipients: this.getDistributionList(reportType),
                format: 'HTML',
                deliveryMethod: 'EMAIL',
            },
        };
        this.emit('reportGenerated', report);
        return report;
    }
    async generateReportSections(reportType, metrics, auditTrails, alerts, ruleMetrics, period, scope, customSections) {
        const sections = [];
        // Executive Summary
        sections.push(await this.generateExecutiveSummary(metrics, auditTrails, alerts));
        // Compliance Overview
        sections.push(await this.generateComplianceOverview(metrics, auditTrails, period));
        // Detailed Analysis by Framework
        sections.push(await this.generateFrameworkAnalysis(auditTrails, scope.frameworks));
        // Risk Assessment
        sections.push(await this.generateRiskAssessment(auditTrails, alerts));
        // Rule Performance Analysis
        sections.push(await this.generateRulePerformanceAnalysis(ruleMetrics));
        // Trend Analysis (for non-daily reports)
        if (reportType !== 'DAILY') {
            sections.push(await this.generateTrendAnalysis(period, reportType));
        }
        // Exception Analysis
        sections.push(await this.generateExceptionAnalysis(period));
        // Alert Summary
        sections.push(await this.generateAlertSummary(alerts));
        // Recommendations
        sections.push(await this.generateRecommendationsSection(auditTrails, alerts, ruleMetrics));
        return sections;
    }
    async generateExecutiveSummary(metrics, auditTrails, alerts) {
        const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL').length;
        const highAlerts = alerts.filter(alert => alert.severity === 'HIGH').length;
        return {
            id: 'executive-summary',
            title: 'Executive Summary',
            type: 'SUMMARY',
            content: {
                text: `
          During the reporting period, ${metrics.totalValidations} compliance validations were performed 
          across the organization. The overall compliance rate was ${metrics.complianceRate}%, 
          with ${metrics.criticalViolations} critical violations identified.
          
          ${criticalAlerts > 0 ? `There are ${criticalAlerts} critical alerts requiring immediate attention.` : 'No critical alerts were generated during this period.'}
          ${highAlerts > 0 ? `Additionally, ${highAlerts} high-priority alerts need review.` : ''}
          
          The compliance posture shows ${metrics.complianceRate >= 95 ? 'excellent' :
                    metrics.complianceRate >= 90 ? 'good' :
                        metrics.complianceRate >= 80 ? 'adequate' : 'concerning'} 
          performance with opportunities for improvement in key areas.
        `,
                charts: [
                    {
                        type: 'pie',
                        title: 'Compliance Status Distribution',
                        data: {
                            labels: ['Compliant', 'Non-Compliant', 'Exceptions'],
                            datasets: [{
                                    label: 'Entities',
                                    data: [
                                        metrics.totalValidations - metrics.criticalViolations - metrics.activeExceptions,
                                        metrics.criticalViolations,
                                        metrics.activeExceptions
                                    ],
                                    backgroundColor: ['#22c55e', '#ef4444', '#f59e0b']
                                }]
                        }
                    }
                ]
            },
            insights: [
                `Compliance rate: ${metrics.complianceRate}%`,
                `Critical violations: ${metrics.criticalViolations}`,
                `Active exceptions: ${metrics.activeExceptions}`,
                `Open alerts: ${metrics.openAlerts}`
            ],
            actionItems: criticalAlerts > 0 ? [
                'Address critical compliance violations immediately',
                'Review high-priority alerts within 24 hours',
                'Update compliance procedures based on findings'
            ] : []
        };
    }
    async generateComplianceOverview(metrics, auditTrails, period) {
        // Analyze compliance by entity type
        const entityTypes = new Map();
        for (const trail of auditTrails) {
            if (trail.eventType === 'VALIDATION') {
                const entityType = trail.entityType;
                if (!entityTypes.has(entityType)) {
                    entityTypes.set(entityType, { total: 0, compliant: 0 });
                }
                const stats = entityTypes.get(entityType);
                stats.total++;
                if (trail.complianceStatus === 'COMPLIANT' || trail.complianceStatus === 'WARNING') {
                    stats.compliant++;
                }
            }
        }
        const entityComplianceData = Array.from(entityTypes.entries()).map(([type, stats]) => ({
            entityType: type,
            total: stats.total,
            compliant: stats.compliant,
            complianceRate: stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0
        }));
        return {
            id: 'compliance-overview',
            title: 'Compliance Overview',
            type: 'DETAILED_ANALYSIS',
            content: {
                text: `
          This section provides a comprehensive overview of compliance performance during the reporting period.
          Analysis covers all entity types and regulatory frameworks within scope.
        `,
                charts: [
                    {
                        type: 'bar',
                        title: 'Compliance Rate by Entity Type',
                        data: {
                            labels: entityComplianceData.map(item => item.entityType),
                            datasets: [{
                                    label: 'Compliance Rate (%)',
                                    data: entityComplianceData.map(item => item.complianceRate),
                                    backgroundColor: entityComplianceData.map(item => item.complianceRate >= 95 ? '#22c55e' :
                                        item.complianceRate >= 90 ? '#84cc16' :
                                            item.complianceRate >= 80 ? '#f59e0b' : '#ef4444')
                                }]
                        }
                    }
                ],
                tables: [
                    {
                        title: 'Entity Type Compliance Summary',
                        headers: ['Entity Type', 'Total Validations', 'Compliant', 'Compliance Rate'],
                        rows: entityComplianceData.map(item => [
                            item.entityType,
                            item.total.toString(),
                            item.compliant.toString(),
                            `${item.complianceRate}%`
                        ]),
                        summary: {
                            totalRows: entityComplianceData.length,
                            aggregations: {
                                'Total Validations': entityComplianceData.reduce((sum, item) => sum + item.total, 0),
                                'Average Compliance Rate': Math.round(entityComplianceData.reduce((sum, item) => sum + item.complianceRate, 0) / entityComplianceData.length)
                            }
                        }
                    }
                ]
            },
            insights: [
                `${entityComplianceData.length} entity types analyzed`,
                `Highest compliance: ${Math.max(...entityComplianceData.map(item => item.complianceRate))}%`,
                `Lowest compliance: ${Math.min(...entityComplianceData.map(item => item.complianceRate))}%`,
                `Total validations performed: ${metrics.totalValidations}`
            ]
        };
    }
    async generateFrameworkAnalysis(auditTrails, frameworks) {
        // Analyze compliance by regulatory framework
        const frameworkStats = new Map();
        // This would be enhanced with actual rule categorization
        const frameworkMapping = {
            'SEC': ['SEC_ADV_CUSTODY', 'SEC_ACCREDITED_INVESTOR', 'SEC_FIDUCIARY_DUTY'],
            'FINRA': ['FINRA_SUITABILITY', 'FINRA_CONCENTRATION_RISK'],
            'GDPR': ['GDPR_DATA_RETENTION', 'GDPR_CONSENT_MANAGEMENT'],
            'FATCA': ['FATCA_US_PERSON_REPORTING'],
            'CRS': ['CRS_ACCOUNT_HOLDER_IDENTIFICATION']
        };
        for (const framework of frameworks) {
            frameworkStats.set(framework, { violations: 0, total: 0 });
        }
        const frameworkData = Array.from(frameworkStats.entries()).map(([framework, stats]) => ({
            framework,
            violations: Math.floor(Math.random() * 10), // Mock data
            total: Math.floor(Math.random() * 100) + 50,
            complianceRate: 95 - Math.floor(Math.random() * 10)
        }));
        return {
            id: 'framework-analysis',
            title: 'Regulatory Framework Analysis',
            type: 'DETAILED_ANALYSIS',
            content: {
                text: `
          Analysis of compliance performance across different regulatory frameworks.
          Each framework has specific requirements and violation thresholds.
        `,
                charts: [
                    {
                        type: 'bar',
                        title: 'Violations by Regulatory Framework',
                        data: {
                            labels: frameworkData.map(item => item.framework),
                            datasets: [{
                                    label: 'Violations',
                                    data: frameworkData.map(item => item.violations),
                                    backgroundColor: '#ef4444'
                                }, {
                                    label: 'Total Checks',
                                    data: frameworkData.map(item => item.total),
                                    backgroundColor: '#3b82f6'
                                }]
                        }
                    }
                ],
                tables: [
                    {
                        title: 'Framework Compliance Details',
                        headers: ['Framework', 'Total Checks', 'Violations', 'Compliance Rate', 'Risk Level'],
                        rows: frameworkData.map(item => [
                            item.framework,
                            item.total.toString(),
                            item.violations.toString(),
                            `${item.complianceRate}%`,
                            item.violations > 5 ? 'High' : item.violations > 2 ? 'Medium' : 'Low'
                        ])
                    }
                ]
            },
            insights: [
                `${frameworks.length} regulatory frameworks monitored`,
                `Most violations: ${frameworkData.reduce((max, item) => item.violations > max.violations ? item : max).framework}`,
                `Best compliance: ${frameworkData.reduce((max, item) => item.complianceRate > max.complianceRate ? item : max).framework}`
            ]
        };
    }
    async generateRiskAssessment(auditTrails, alerts) {
        const riskFactors = [
            { factor: 'Critical Violations', score: alerts.filter(a => a.severity === 'CRITICAL').length * 10, weight: 0.4 },
            { factor: 'High Priority Alerts', score: alerts.filter(a => a.severity === 'HIGH').length * 5, weight: 0.3 },
            { factor: 'Compliance Rate', score: (100 - 85) * 2, weight: 0.2 }, // Mock compliance rate of 85%
            { factor: 'Exception Volume', score: Math.floor(Math.random() * 20), weight: 0.1 }
        ];
        const overallRiskScore = riskFactors.reduce((total, factor) => total + (factor.score * factor.weight), 0);
        const riskLevel = overallRiskScore > 30 ? 'HIGH' : overallRiskScore > 15 ? 'MEDIUM' : 'LOW';
        return {
            id: 'risk-assessment',
            title: 'Risk Assessment',
            type: 'DETAILED_ANALYSIS',
            content: {
                text: `
          Current compliance risk level: ${riskLevel}
          Overall risk score: ${Math.round(overallRiskScore)}
          
          The risk assessment considers critical violations, alert severity, compliance rates, and exception volumes.
          Immediate attention is required for any HIGH risk areas.
        `,
                charts: [
                    {
                        type: 'bar',
                        title: 'Risk Factor Analysis',
                        data: {
                            labels: riskFactors.map(f => f.factor),
                            datasets: [{
                                    label: 'Risk Score',
                                    data: riskFactors.map(f => f.score),
                                    backgroundColor: riskFactors.map(f => f.score > 20 ? '#ef4444' : f.score > 10 ? '#f59e0b' : '#22c55e')
                                }]
                        }
                    }
                ]
            },
            insights: [
                `Overall risk level: ${riskLevel}`,
                `Highest risk factor: ${riskFactors.reduce((max, f) => f.score > max.score ? f : max).factor}`,
                `Risk score: ${Math.round(overallRiskScore)}/100`
            ],
            actionItems: overallRiskScore > 20 ? [
                'Implement immediate risk mitigation measures',
                'Review and update compliance procedures',
                'Increase monitoring frequency for high-risk areas'
            ] : []
        };
    }
    async generateRulePerformanceAnalysis(ruleMetrics) {
        const topPerformingRules = ruleMetrics
            .filter(rule => rule.executionCount > 0)
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 10);
        const slowestRules = ruleMetrics
            .filter(rule => rule.executionCount > 0)
            .sort((a, b) => b.averageExecutionTime - a.averageExecutionTime)
            .slice(0, 5);
        return {
            id: 'rule-performance',
            title: 'Rule Performance Analysis',
            type: 'DETAILED_ANALYSIS',
            content: {
                text: `
          Analysis of individual rule performance, including execution times and success rates.
          This helps identify rules that may need optimization or review.
        `,
                tables: [
                    {
                        title: 'Top Performing Rules',
                        headers: ['Rule ID', 'Executions', 'Success Rate', 'Avg Time (ms)'],
                        rows: topPerformingRules.map(rule => [
                            rule.ruleId,
                            rule.executionCount.toString(),
                            `${Math.round(rule.successRate)}%`,
                            Math.round(rule.averageExecutionTime).toString()
                        ])
                    },
                    {
                        title: 'Slowest Executing Rules',
                        headers: ['Rule ID', 'Executions', 'Avg Time (ms)', 'Success Rate'],
                        rows: slowestRules.map(rule => [
                            rule.ruleId,
                            rule.executionCount.toString(),
                            Math.round(rule.averageExecutionTime).toString(),
                            `${Math.round(rule.successRate)}%`
                        ])
                    }
                ]
            },
            insights: [
                `${ruleMetrics.length} rules analyzed`,
                `Best performing rule: ${topPerformingRules[0]?.ruleId || 'N/A'}`,
                `Slowest rule: ${slowestRules[0]?.ruleId || 'N/A'} (${Math.round(slowestRules[0]?.averageExecutionTime || 0)}ms)`
            ]
        };
    }
    async generateTrendAnalysis(period, reportType) {
        // Mock trend data - in production, this would analyze historical data
        const intervals = this.getTimeIntervals(period, reportType);
        const trendData = intervals.map((interval, index) => ({
            period: interval,
            complianceRate: 85 + Math.random() * 10, // Mock data
            violations: Math.floor(Math.random() * 20),
            validations: Math.floor(Math.random() * 100) + 50
        }));
        return {
            id: 'trend-analysis',
            title: 'Compliance Trends',
            type: 'TREND_ANALYSIS',
            content: {
                text: `
          Trend analysis shows compliance performance over time, helping identify patterns and improvements.
        `,
                charts: [
                    {
                        type: 'line',
                        title: 'Compliance Rate Trend',
                        data: {
                            labels: trendData.map(d => d.period),
                            datasets: [{
                                    label: 'Compliance Rate (%)',
                                    data: trendData.map(d => Math.round(d.complianceRate)),
                                    borderColor: '#3b82f6',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)'
                                }]
                        }
                    },
                    {
                        type: 'bar',
                        title: 'Violations Over Time',
                        data: {
                            labels: trendData.map(d => d.period),
                            datasets: [{
                                    label: 'Violations',
                                    data: trendData.map(d => d.violations),
                                    backgroundColor: '#ef4444'
                                }]
                        }
                    }
                ]
            },
            insights: [
                `Average compliance rate: ${Math.round(trendData.reduce((sum, d) => sum + d.complianceRate, 0) / trendData.length)}%`,
                `Trend direction: ${trendData[trendData.length - 1].complianceRate > trendData[0].complianceRate ? 'Improving' : 'Declining'}`,
                `Total violations in period: ${trendData.reduce((sum, d) => sum + d.violations, 0)}`
            ]
        };
    }
    async generateExceptionAnalysis(period) {
        const activeExceptionsCount = await this.getActiveExceptionsCount();
        return {
            id: 'exception-analysis',
            title: 'Exception Analysis',
            type: 'DETAILED_ANALYSIS',
            content: {
                text: `
          Analysis of compliance exceptions granted during the reporting period.
          Exceptions are monitored to ensure they remain valid and necessary.
        `,
                data: [
                    { type: 'Temporary', count: Math.floor(activeExceptionsCount * 0.6) },
                    { type: 'Permanent', count: Math.floor(activeExceptionsCount * 0.3) },
                    { type: 'Conditional', count: Math.floor(activeExceptionsCount * 0.1) }
                ]
            },
            insights: [
                `Total active exceptions: ${activeExceptionsCount}`,
                'Most exceptions are temporary in nature',
                'Regular review of permanent exceptions recommended'
            ]
        };
    }
    async generateAlertSummary(alerts) {
        const alertsByType = alerts.reduce((acc, alert) => {
            acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
            return acc;
        }, {});
        const alertsBySeverity = alerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {});
        return {
            id: 'alert-summary',
            title: 'Alert Summary',
            type: 'SUMMARY',
            content: {
                text: `
          Summary of compliance alerts generated during the reporting period.
          ${alerts.length} total alerts were generated.
        `,
                charts: [
                    {
                        type: 'pie',
                        title: 'Alerts by Severity',
                        data: {
                            labels: Object.keys(alertsBySeverity),
                            datasets: [{
                                    label: 'Count',
                                    data: Object.values(alertsBySeverity),
                                    backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e']
                                }]
                        }
                    }
                ]
            },
            insights: [
                `Total alerts: ${alerts.length}`,
                `Critical alerts: ${alertsBySeverity['CRITICAL'] || 0}`,
                `Most common alert type: ${Object.entries(alertsByType).reduce((a, b) => a[1] > b[1] ? a : b)[0] || 'N/A'}`
            ]
        };
    }
    async generateRecommendationsSection(auditTrails, alerts, ruleMetrics) {
        const recommendations = await this.generateRecommendations({ criticalViolations: alerts.filter(a => a.severity === 'CRITICAL').length }, auditTrails, alerts, ruleMetrics);
        return {
            id: 'recommendations',
            title: 'Recommendations',
            type: 'RECOMMENDATIONS',
            content: {
                text: `
          Based on the compliance analysis, the following recommendations are provided to improve
          the overall compliance posture and reduce risk.
        `,
                data: recommendations
            },
            insights: [
                `${recommendations.length} recommendations generated`,
                `${recommendations.filter(r => r.priority === 'CRITICAL').length} critical priority items`,
                `${recommendations.filter(r => r.priority === 'HIGH').length} high priority items`
            ]
        };
    }
    async generateRecommendations(metrics, auditTrails, alerts, ruleMetrics) {
        const recommendations = [];
        // Critical violations recommendation
        if (metrics.criticalViolations > 0) {
            recommendations.push({
                id: `rec_critical_${Date.now()}`,
                type: 'IMMEDIATE_ACTION',
                priority: 'CRITICAL',
                title: 'Address Critical Compliance Violations',
                description: `${metrics.criticalViolations} critical compliance violations require immediate attention`,
                action: 'Review all critical violations and implement corrective actions within 24 hours',
                estimatedEffort: '1-2 days',
                deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
                relatedRules: alerts.filter(a => a.severity === 'CRITICAL').map(a => a.ruleId).filter(Boolean),
                resources: ['Compliance Manual', 'Regulatory Guidelines']
            });
        }
        // Performance optimization recommendation
        const slowRules = ruleMetrics.filter(rule => rule.averageExecutionTime > 1000);
        if (slowRules.length > 0) {
            recommendations.push({
                id: `rec_performance_${Date.now()}`,
                type: 'SYSTEM_UPDATE',
                priority: 'MEDIUM',
                title: 'Optimize Rule Performance',
                description: `${slowRules.length} compliance rules have slow execution times`,
                action: 'Review and optimize slow-performing compliance rules to improve system performance',
                estimatedEffort: '1-2 weeks',
                deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                relatedRules: slowRules.map(rule => rule.ruleId),
                resources: ['Performance Optimization Guide', 'Rule Configuration Manual']
            });
        }
        // Training recommendation
        const failureRate = auditTrails.filter(trail => trail.complianceStatus === 'NON_COMPLIANT').length / auditTrails.length;
        if (failureRate > 0.1) { // More than 10% failure rate
            recommendations.push({
                id: `rec_training_${Date.now()}`,
                type: 'TRAINING',
                priority: 'HIGH',
                title: 'Enhanced Compliance Training',
                description: `Compliance failure rate of ${Math.round(failureRate * 100)}% indicates need for additional training`,
                action: 'Implement enhanced compliance training program for all relevant staff',
                estimatedEffort: '3-4 weeks',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                relatedRules: [],
                resources: ['Training Materials', 'Compliance Best Practices', 'Regulatory Updates']
            });
        }
        return recommendations;
    }
    generateReportId(reportType) {
        const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
        return `${reportType.toLowerCase()}_${timestamp}_${Math.random().toString(36).substring(2, 8)}`;
    }
    calculateTotalEntities(auditTrails) {
        const uniqueEntities = new Set();
        for (const trail of auditTrails) {
            uniqueEntities.add(`${trail.entityType}:${trail.entityId}`);
        }
        return uniqueEntities.size;
    }
    calculateCompliantEntities(auditTrails) {
        const entityStatus = new Map();
        for (const trail of auditTrails) {
            const entityKey = `${trail.entityType}:${trail.entityId}`;
            entityStatus.set(entityKey, trail.complianceStatus);
        }
        let compliantCount = 0;
        for (const status of entityStatus.values()) {
            if (status === 'COMPLIANT' || status === 'WARNING') {
                compliantCount++;
            }
        }
        return compliantCount;
    }
    calculateNonCompliantEntities(auditTrails) {
        const totalEntities = this.calculateTotalEntities(auditTrails);
        const compliantEntities = this.calculateCompliantEntities(auditTrails);
        return totalEntities - compliantEntities;
    }
    async getActiveExceptionsCount() {
        // This would query the actual exceptions in production
        return Math.floor(Math.random() * 20) + 5; // Mock data
    }
    calculateNextReviewDate(reportType) {
        const now = new Date();
        switch (reportType) {
            case 'DAILY': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case 'WEEKLY': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            case 'MONTHLY': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            case 'QUARTERLY': return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
            case 'ANNUAL': return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
            default: return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
    }
    getDistributionList(reportType) {
        const lists = this.config.reporting.distributionLists;
        switch (reportType) {
            case 'DAILY': return lists.daily;
            case 'WEEKLY': return lists.weekly;
            case 'MONTHLY': return lists.monthly;
            case 'QUARTERLY': return lists.quarterly;
            default: return lists.monthly;
        }
    }
    getTimeIntervals(period, reportType) {
        const intervals = [];
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        // Generate intervals based on report type
        switch (reportType) {
            case 'WEEKLY':
                // Generate daily intervals for weekly report
                while (start <= end) {
                    intervals.push(start.toISOString().split('T')[0]);
                    start.setDate(start.getDate() + 1);
                }
                break;
            case 'MONTHLY':
                // Generate weekly intervals for monthly report
                while (start <= end) {
                    intervals.push(`Week of ${start.toISOString().split('T')[0]}`);
                    start.setDate(start.getDate() + 7);
                }
                break;
            case 'QUARTERLY':
                // Generate monthly intervals for quarterly report
                while (start <= end) {
                    intervals.push(`${start.toLocaleString('default', { month: 'long' })} ${start.getFullYear()}`);
                    start.setMonth(start.getMonth() + 1);
                }
                break;
            case 'ANNUAL':
                // Generate quarterly intervals for annual report
                const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
                for (let i = 0; i < 4; i++) {
                    intervals.push(`${quarters[i]} ${start.getFullYear()}`);
                }
                break;
            default:
                intervals.push(period.startDate.toISOString().split('T')[0]);
                break;
        }
        return intervals.slice(0, 12); // Limit to 12 intervals for chart readability
    }
    async exportReport(report, format) {
        const fileName = `${report.id}.${format.toLowerCase()}`;
        const filePath = path.join('/tmp', fileName);
        switch (format) {
            case 'JSON':
                const jsonContent = JSON.stringify(report, null, 2);
                await fs.writeFile(filePath, jsonContent);
                return { filePath, content: jsonContent };
            case 'HTML':
                const htmlContent = this.generateHTMLReport(report);
                await fs.writeFile(filePath, htmlContent);
                return { filePath, content: htmlContent };
            case 'PDF':
                // In production, would use a PDF generation library
                const pdfContent = `PDF Export of Report: ${report.id}`;
                await fs.writeFile(filePath, pdfContent);
                return { filePath };
            case 'EXCEL':
                // In production, would use an Excel generation library
                const excelContent = `Excel Export of Report: ${report.id}`;
                await fs.writeFile(filePath, excelContent);
                return { filePath };
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${report.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .chart-placeholder { background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .insight { background: #e3f2fd; padding: 10px; margin: 10px 0; border-left: 4px solid #2196f3; }
        .recommendation { background: #fff3e0; padding: 15px; margin: 15px 0; border-left: 4px solid #ff9800; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.title}</h1>
        <p><strong>Report ID:</strong> ${report.id}</p>
        <p><strong>Generated:</strong> ${report.generatedAt.toISOString()}</p>
        <p><strong>Period:</strong> ${report.period.startDate.toISOString().split('T')[0]} to ${report.period.endDate.toISOString().split('T')[0]}</p>
        <p><strong>Description:</strong> ${report.description}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <ul>
            <li>Total Entities Reviewed: ${report.summary.totalEntitiesReviewed}</li>
            <li>Overall Compliance Rate: ${report.summary.overallComplianceRate}%</li>
            <li>Critical Violations: ${report.summary.criticalViolations}</li>
            <li>Active Exceptions: ${report.summary.exceptionsGranted}</li>
        </ul>
    </div>

    ${report.sections.map(section => `
        <div class="section">
            <h2>${section.title}</h2>
            ${section.content.text ? `<p>${section.content.text.replace(/\n/g, '<br>')}</p>` : ''}
            
            ${section.content.charts ? section.content.charts.map(chart => `<div class="chart-placeholder">Chart: ${chart.title}</div>`).join('') : ''}
            
            ${section.content.tables ? section.content.tables.map(table => `
                <h3>${table.title}</h3>
                <table>
                    <thead>
                        <tr>${table.headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${table.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                </table>
            `).join('') : ''}
            
            ${section.insights.map(insight => `<div class="insight">${insight}</div>`).join('')}
        </div>
    `).join('')}

    <div class="section">
        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation">
                <h4>${rec.title} (${rec.priority} Priority)</h4>
                <p><strong>Type:</strong> ${rec.type}</p>
                <p><strong>Description:</strong> ${rec.description}</p>
                <p><strong>Action:</strong> ${rec.action}</p>
                <p><strong>Estimated Effort:</strong> ${rec.estimatedEffort}</p>
                ${rec.deadline ? `<p><strong>Deadline:</strong> ${rec.deadline.toISOString().split('T')[0]}</p>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;
    }
}
exports.ComplianceReportingService = ComplianceReportingService;

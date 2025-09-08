"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiJurisdictionComplianceService = void 0;
const crypto_1 = require("crypto");
const Regulatory_1 = require("../../models/regulatory/Regulatory");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class MultiJurisdictionComplianceService {
    eventPublisher;
    jurisdictionProfiles = new Map();
    assessments = new Map();
    conflicts = new Map();
    monitoringRules = new Map();
    constructor() {
        this.eventPublisher = new eventPublisher_1.EventPublisher('MultiJurisdictionCompliance');
        this.initializeJurisdictionProfiles();
        this.initializeMonitoringRules();
    }
    async createComplianceAssessment(tenantId, scope, assessedBy) {
        try {
            logger_1.logger.info('Creating multi-jurisdiction compliance assessment', {
                tenantId,
                jurisdictions: scope.jurisdictions,
                assessedBy
            });
            const assessmentId = (0, crypto_1.randomUUID)();
            // Gather all applicable requirements
            const applicableRequirements = this.getApplicableRequirements(scope);
            // Assess compliance for each requirement
            const findings = await this.assessRequirements(tenantId, applicableRequirements, scope);
            // Calculate risk score
            const riskScore = this.calculateRiskScore(findings, applicableRequirements);
            // Generate recommendations
            const recommendations = await this.generateRecommendations(applicableRequirements, findings);
            const assessment = {
                id: assessmentId,
                tenantId,
                assessmentDate: new Date(),
                scope,
                findings,
                riskScore,
                recommendations,
                assessedBy,
                status: 'draft',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.assessments.set(assessmentId, assessment);
            await this.eventPublisher.publish('regulatory.compliance_assessment.created', {
                tenantId,
                assessmentId,
                jurisdictions: scope.jurisdictions.length,
                riskScore
            });
            return assessment;
        }
        catch (error) {
            logger_1.logger.error('Error creating compliance assessment:', error);
            throw error;
        }
    }
    async identifyJurisdictionConflicts(jurisdictions, businessActivities) {
        try {
            logger_1.logger.info('Identifying jurisdiction conflicts', {
                jurisdictions,
                businessActivities
            });
            const conflicts = [];
            // Check for reporting overlaps
            const reportingConflicts = this.identifyReportingOverlaps(jurisdictions);
            conflicts.push(...reportingConflicts);
            // Check for regulatory conflicts
            const regulatoryConflicts = this.identifyRegulatoryConflicts(jurisdictions, businessActivities);
            conflicts.push(...regulatoryConflicts);
            // Check for tax treaty implications
            const taxTreatyConflicts = this.identifyTaxTreatyConflicts(jurisdictions);
            conflicts.push(...taxTreatyConflicts);
            // Store identified conflicts
            conflicts.forEach(conflict => {
                this.conflicts.set(conflict.id, conflict);
            });
            await this.eventPublisher.publish('regulatory.jurisdiction_conflicts.identified', {
                conflictCount: conflicts.length,
                jurisdictions,
                criticalConflicts: conflicts.filter(c => c.businessImpact === 'high').length
            });
            return conflicts;
        }
        catch (error) {
            logger_1.logger.error('Error identifying jurisdiction conflicts:', error);
            throw error;
        }
    }
    async updateComplianceStatus(requirementId, jurisdiction, status, evidence, updatedBy) {
        try {
            const profile = this.jurisdictionProfiles.get(jurisdiction);
            if (!profile) {
                throw new Error(`Jurisdiction profile not found: ${jurisdiction}`);
            }
            const requirement = profile.keyRequirements.find(req => req.id === requirementId);
            if (!requirement) {
                throw new Error(`Requirement not found: ${requirementId}`);
            }
            const previousStatus = requirement.compliance.status;
            requirement.compliance.status = status;
            requirement.compliance.lastAssessed = new Date();
            requirement.compliance.evidence = evidence;
            // Set next assessment due date based on severity
            const monthsToNext = requirement.severity === 'critical' ? 3 :
                requirement.severity === 'high' ? 6 : 12;
            requirement.compliance.nextAssessmentDue = new Date();
            requirement.compliance.nextAssessmentDue.setMonth(requirement.compliance.nextAssessmentDue.getMonth() + monthsToNext);
            this.jurisdictionProfiles.set(jurisdiction, profile);
            await this.eventPublisher.publish('regulatory.compliance_status.updated', {
                requirementId,
                jurisdiction,
                previousStatus,
                newStatus: status,
                updatedBy
            });
            // Generate alerts for critical non-compliance
            if (status === 'non_compliant' && requirement.severity === 'critical') {
                await this.generateComplianceAlert(requirement, jurisdiction);
            }
        }
        catch (error) {
            logger_1.logger.error('Error updating compliance status:', error);
            throw error;
        }
    }
    async generateComplianceReport(tenantId, jurisdictions, reportType) {
        try {
            logger_1.logger.info('Generating multi-jurisdiction compliance report', {
                tenantId,
                jurisdictions,
                reportType
            });
            let totalRequirements = 0;
            let compliantRequirements = 0;
            let criticalIssues = 0;
            const jurisdictionBreakdown = [];
            // Analyze each jurisdiction
            for (const jurisdiction of jurisdictions) {
                const profile = this.jurisdictionProfiles.get(jurisdiction);
                if (!profile)
                    continue;
                const requirements = profile.keyRequirements;
                const compliant = requirements.filter(req => req.compliance.status === 'compliant').length;
                const critical = requirements.filter(req => req.compliance.status === 'non_compliant' && req.severity === 'critical').length;
                totalRequirements += requirements.length;
                compliantRequirements += compliant;
                criticalIssues += critical;
                const nextActions = requirements
                    .filter(req => req.compliance.status === 'non_compliant')
                    .slice(0, 3)
                    .map(req => `Address ${req.requirementName}`);
                jurisdictionBreakdown.push({
                    jurisdiction,
                    complianceRate: (compliant / requirements.length) * 100,
                    criticalIssues: critical,
                    nextActions
                });
            }
            const compliantPercentage = totalRequirements > 0 ?
                (compliantRequirements / totalRequirements) * 100 : 0;
            // Calculate overall risk score
            const overallRiskScore = this.calculateOverallRiskScore(jurisdictions);
            // Get recommendations
            const recommendations = await this.getComplianceRecommendations(jurisdictions);
            // Get conflicts
            const conflicts = Array.from(this.conflicts.values())
                .filter(conflict => conflict.jurisdictionsInvolved.some(j => jurisdictions.includes(j)));
            return {
                summary: {
                    totalRequirements,
                    compliantPercentage,
                    criticalIssues,
                    overallRiskScore
                },
                jurisdictionBreakdown,
                recommendations,
                conflicts
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating compliance report:', error);
            throw error;
        }
    }
    async monitorComplianceThresholds(tenantId) {
        try {
            const alerts = [];
            const activeRules = Array.from(this.monitoringRules.values()).filter(rule => rule.isActive);
            for (const rule of activeRules) {
                const alertResult = await this.evaluateMonitoringRule(tenantId, rule);
                if (alertResult) {
                    alerts.push(alertResult);
                    // Execute automated responses if configured
                    if (rule.automatedResponse.enabled) {
                        await this.executeAutomatedResponse(rule, alertResult);
                    }
                }
            }
            if (alerts.length > 0) {
                await this.eventPublisher.publish('regulatory.compliance_alerts.triggered', {
                    tenantId,
                    alertCount: alerts.length,
                    criticalAlerts: alerts.filter(a => a.alertLevel === 'critical').length
                });
            }
            return alerts;
        }
        catch (error) {
            logger_1.logger.error('Error monitoring compliance thresholds:', error);
            throw error;
        }
    }
    async getJurisdictionProfile(jurisdiction) {
        return this.jurisdictionProfiles.get(jurisdiction) || null;
    }
    async getComplianceAssessment(assessmentId) {
        return this.assessments.get(assessmentId) || null;
    }
    async getComplianceAssessmentsByTenant(tenantId) {
        return Array.from(this.assessments.values()).filter(assessment => assessment.tenantId === tenantId);
    }
    initializeJurisdictionProfiles() {
        // Initialize US profile
        const usProfile = {
            jurisdiction: Regulatory_1.RegulatoryJurisdiction.SEC,
            jurisdictionName: 'United States',
            regulatoryBodies: ['SEC', 'FINRA', 'CFTC', 'FinCEN'],
            businessActivities: ['Investment Advisory', 'Broker-Dealer', 'Investment Company'],
            clientTypes: ['Retail', 'Institutional', 'High Net Worth'],
            assetThresholds: {
                'ADV_REGISTRATION': 100000000, // $100M
                'FORM_PF': 150000000, // $150M
                'FORM_13F': 100000000 // $100M
            },
            reportingFrequency: {
                'FORM_ADV': 'annually',
                'FORM_PF': 'quarterly',
                'FORM_13F': 'quarterly'
            },
            keyRequirements: [
                {
                    id: 'us-001',
                    jurisdiction: Regulatory_1.RegulatoryJurisdiction.SEC,
                    requirementType: 'registration',
                    requirementName: 'SEC Registration',
                    description: 'Investment advisers with $100M+ AUM must register with SEC',
                    applicabilityConditions: ['AUM >= $100M', 'Investment Advisory Business'],
                    compliance: {
                        status: 'compliant',
                        lastAssessed: new Date(),
                        nextAssessmentDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                        responsiblePerson: 'Chief Compliance Officer',
                        evidence: ['Form ADV on file', 'Registration renewal completed']
                    },
                    regulatoryBody: 'SEC',
                    severity: 'critical',
                    penalties: {
                        monetary: 500000,
                        businessImpact: 'Cannot operate without registration',
                        reputationalRisk: 'Significant regulatory violation'
                    }
                }
            ],
            lastReview: new Date(),
            nextReview: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        };
        this.jurisdictionProfiles.set(Regulatory_1.RegulatoryJurisdiction.SEC, usProfile);
        // Initialize EU profile (simplified)
        const euProfile = {
            jurisdiction: Regulatory_1.RegulatoryJurisdiction.INTERNATIONAL,
            jurisdictionName: 'European Union',
            regulatoryBodies: ['ESMA', 'Local NCAs'],
            businessActivities: ['AIFM', 'UCITS Management', 'MiFID Services'],
            clientTypes: ['Professional', 'Retail', 'Eligible Counterparties'],
            assetThresholds: {
                'AIFM_LICENSE': 100000000, // €100M
                'MIFID_LICENSE': 50000000 // €50M
            },
            reportingFrequency: {
                'AIFM_REPORTING': 'quarterly',
                'MIFID_REPORTING': 'monthly'
            },
            keyRequirements: [],
            lastReview: new Date(),
            nextReview: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        };
        this.jurisdictionProfiles.set(Regulatory_1.RegulatoryJurisdiction.INTERNATIONAL, euProfile);
    }
    initializeMonitoringRules() {
        // US AUM threshold monitoring
        const aumRule = {
            id: 'us-aum-threshold',
            ruleName: 'US AUM Threshold Monitoring',
            jurisdiction: Regulatory_1.RegulatoryJurisdiction.SEC,
            monitoringType: 'threshold',
            conditions: {
                metric: 'total_aum',
                thresholds: [100000000, 150000000] // $100M, $150M
            },
            alertCriteria: {
                warningThreshold: 95000000, // $95M
                criticalThreshold: 100000000 // $100M
            },
            automatedResponse: {
                enabled: true,
                actions: ['Generate compliance alert', 'Notify compliance team']
            },
            isActive: true
        };
        this.monitoringRules.set(aumRule.id, aumRule);
    }
    getApplicableRequirements(scope) {
        const requirements = [];
        for (const jurisdiction of scope.jurisdictions) {
            const profile = this.jurisdictionProfiles.get(jurisdiction);
            if (profile) {
                // Filter requirements based on business activities
                const applicable = profile.keyRequirements.filter(req => req.applicabilityConditions.some(condition => scope.businessActivities.some(activity => condition.toLowerCase().includes(activity.toLowerCase()))));
                requirements.push(...applicable);
            }
        }
        return requirements;
    }
    async assessRequirements(tenantId, requirements, scope) {
        // Mock assessment logic
        const total = requirements.length;
        const compliant = Math.floor(total * 0.7);
        const nonCompliant = Math.floor(total * 0.2);
        const partial = total - compliant - nonCompliant;
        const critical = Math.floor(nonCompliant * 0.5);
        const high = nonCompliant - critical;
        return {
            compliantRequirements: compliant,
            nonCompliantRequirements: nonCompliant,
            partialComplianceRequirements: partial,
            criticalIssues: critical,
            highRiskIssues: high
        };
    }
    calculateRiskScore(findings, requirements) {
        const totalRequirements = requirements.length;
        if (totalRequirements === 0)
            return 0;
        const criticalWeight = 40;
        const highWeight = 25;
        const mediumWeight = 15;
        const nonCompliantWeight = 20;
        const criticalScore = (findings.criticalIssues / totalRequirements) * criticalWeight;
        const highScore = (findings.highRiskIssues / totalRequirements) * highWeight;
        const nonCompliantScore = (findings.nonCompliantRequirements / totalRequirements) * nonCompliantWeight;
        return Math.min(100, criticalScore + highScore + nonCompliantScore);
    }
    async generateRecommendations(requirements, findings) {
        const recommendations = [];
        if (findings.criticalIssues > 0) {
            recommendations.push({
                priority: 'critical',
                recommendation: 'Address critical compliance gaps immediately',
                jurisdiction: Regulatory_1.RegulatoryJurisdiction.SEC,
                estimatedCost: 50000,
                implementationTimeframe: '30 days'
            });
        }
        if (findings.highRiskIssues > 0) {
            recommendations.push({
                priority: 'high',
                recommendation: 'Implement enhanced compliance monitoring',
                jurisdiction: Regulatory_1.RegulatoryJurisdiction.SEC,
                estimatedCost: 25000,
                implementationTimeframe: '60 days'
            });
        }
        return recommendations;
    }
    identifyReportingOverlaps(jurisdictions) {
        const conflicts = [];
        // Mock overlap detection
        if (jurisdictions.includes(Regulatory_1.RegulatoryJurisdiction.SEC) &&
            jurisdictions.includes(Regulatory_1.RegulatoryJurisdiction.INTERNATIONAL)) {
            conflicts.push({
                id: (0, crypto_1.randomUUID)(),
                conflictType: 'reporting_overlap',
                description: 'Form PF and AIFM quarterly reporting requirements overlap',
                jurisdictionsInvolved: [Regulatory_1.RegulatoryJurisdiction.SEC, Regulatory_1.RegulatoryJurisdiction.INTERNATIONAL],
                businessImpact: 'medium',
                resolutionStrategy: 'Coordinate reporting schedules and data collection',
                status: 'identified',
                identifiedDate: new Date()
            });
        }
        return conflicts;
    }
    identifyRegulatoryConflicts(jurisdictions, businessActivities) {
        // Mock regulatory conflict detection
        return [];
    }
    identifyTaxTreatyConflicts(jurisdictions) {
        // Mock tax treaty conflict detection
        return [];
    }
    calculateOverallRiskScore(jurisdictions) {
        // Mock risk score calculation
        return Math.floor(Math.random() * 100);
    }
    async getComplianceRecommendations(jurisdictions) {
        return [
            {
                priority: 'high',
                description: 'Update compliance policies for new regulations',
                jurisdiction: Regulatory_1.RegulatoryJurisdiction.SEC,
                timeline: '60 days'
            }
        ];
    }
    async evaluateMonitoringRule(tenantId, rule) {
        // Mock rule evaluation
        if (Math.random() > 0.9) { // 10% chance of alert
            return {
                ruleName: rule.ruleName,
                jurisdiction: rule.jurisdiction,
                alertLevel: 'warning',
                message: `Threshold approaching for ${rule.ruleName}`,
                triggeredAt: new Date()
            };
        }
        return null;
    }
    async executeAutomatedResponse(rule, alert) {
        logger_1.logger.info('Executing automated compliance response', {
            ruleName: rule.ruleName,
            actions: rule.automatedResponse.actions
        });
    }
    async generateComplianceAlert(requirement, jurisdiction) {
        await this.eventPublisher.publish('regulatory.compliance_alert.critical', {
            requirementId: requirement.id,
            requirementName: requirement.requirementName,
            jurisdiction,
            severity: requirement.severity
        });
    }
}
exports.MultiJurisdictionComplianceService = MultiJurisdictionComplianceService;

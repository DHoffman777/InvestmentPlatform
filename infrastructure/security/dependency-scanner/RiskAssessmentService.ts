import { EventEmitter } from 'events';
import { Dependency } from './DependencyInventoryService';
import { Vulnerability, VulnerabilityMatch } from './VulnerabilityDatabaseService';

export interface RiskAssessment {
  id: string;
  dependencyId: string;
  tenantId: string;
  assessmentDate: Date;
  overallRiskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
  riskFactors: RiskFactor[];
  businessImpactScore: number;
  technicalRiskScore: number;
  exploitabilityScore: number;
  environmentalScore: number;
  mitigationStrategies: MitigationStrategy[];
  priority: number;
  assessedBy: string;
  validUntil: Date;
  lastUpdated: Date;
}

export interface RiskFactor {
  id: string;
  category: 'VULNERABILITY' | 'DEPENDENCY' | 'ENVIRONMENT' | 'BUSINESS' | 'OPERATIONAL';
  type: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  weight: number;
  score: number;
  weightedScore: number;
  evidence: string[];
  source: string;
  detectedAt: Date;
}

export interface MitigationStrategy {
  id: string;
  type: 'UPDATE' | 'PATCH' | 'REPLACE' | 'CONFIGURE' | 'MONITOR' | 'ACCEPT';
  description: string;
  effort: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  cost: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  timeline: string;
  effectiveness: number; // 0-100
  feasibility: number; // 0-100
  recommendedAction: string;
  prerequisites: string[];
  risks: string[];
  benefits: string[];
  priority: number;
}

export interface BusinessContext {
  tenantId: string;
  applicationCriticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  environmentType: 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT' | 'TEST';
  dataClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  regulatoryRequirements: string[];
  businessOperatingHours: {
    timezone: string;
    operatingDays: string[];
    startTime: string;
    endTime: string;
  };
  maintenanceWindows: MaintenanceWindow[];
  stakeholders: Stakeholder[];
  complianceFrameworks: string[];
}

export interface MaintenanceWindow {
  id: string;
  name: string;
  description: string;
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  type: 'REGULAR' | 'EMERGENCY' | 'PLANNED';
  approvalRequired: boolean;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  department: string;
  contactInfo: {
    email: string;
    phone?: string;
    slack?: string;
  };
  responsibilities: string[];
  escalationLevel: number;
}

export interface RiskAssessmentCriteria {
  vulnerabilityWeights: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  dependencyFactors: {
    directDependency: number;
    transitiveDependency: number;
    maintenanceStatus: number;
    popularityScore: number;
    ageScore: number;
    licenseRisk: number;
  };
  environmentalFactors: {
    production: number;
    staging: number;
    development: number;
    test: number;
  };
  businessFactors: {
    criticalApplication: number;
    highApplication: number;
    mediumApplication: number;
    lowApplication: number;
  };
  exploitabilityFactors: {
    publicExploit: number;
    proofOfConcept: number;
    functional: number;
    unproven: number;
    notDefined: number;
  };
}

export interface PrioritizationResult {
  assessmentId: string;
  dependency: Dependency;
  vulnerabilities: Vulnerability[];
  riskScore: number;
  priority: number;
  recommendedAction: string;
  timeline: string;
  effort: string;
  justification: string;
}

export class RiskAssessmentService extends EventEmitter {
  private assessments: Map<string, RiskAssessment> = new Map();
  private businessContexts: Map<string, BusinessContext> = new Map();
  private assessmentCriteria: RiskAssessmentCriteria;

  constructor() {
    super();
    this.assessmentCriteria = this.getDefaultCriteria();
  }

  private getDefaultCriteria(): RiskAssessmentCriteria {
    return {
      vulnerabilityWeights: {
        critical: 100,
        high: 75,
        medium: 50,
        low: 25,
        info: 5
      },
      dependencyFactors: {
        directDependency: 1.5,
        transitiveDependency: 1.0,
        maintenanceStatus: 1.3,
        popularityScore: 0.8,
        ageScore: 1.1,
        licenseRisk: 1.2
      },
      environmentalFactors: {
        production: 2.0,
        staging: 1.5,
        development: 1.0,
        test: 0.8
      },
      businessFactors: {
        criticalApplication: 2.0,
        highApplication: 1.5,
        mediumApplication: 1.0,
        lowApplication: 0.7
      },
      exploitabilityFactors: {
        publicExploit: 2.0,
        proofOfConcept: 1.5,
        functional: 1.2,
        unproven: 0.8,
        notDefined: 1.0
      }
    };
  }

  async assessRisk(
    dependency: Dependency,
    vulnerabilities: Vulnerability[],
    tenantId: string,
    businessContext?: BusinessContext,
    assessedBy: string = 'system'
  ): Promise<RiskAssessment> {
    const context = businessContext || this.businessContexts.get(tenantId) || this.getDefaultBusinessContext(tenantId);
    
    const riskFactors = await this.calculateRiskFactors(dependency, vulnerabilities, context);
    const businessImpactScore = this.calculateBusinessImpactScore(riskFactors, context);
    const technicalRiskScore = this.calculateTechnicalRiskScore(riskFactors, vulnerability);
    const exploitabilityScore = this.calculateExploitabilityScore(vulnerabilities);
    const environmentalScore = this.calculateEnvironmentalScore(context);
    
    const overallRiskScore = this.calculateOverallRiskScore(
      businessImpactScore,
      technicalRiskScore,
      exploitabilityScore,
      environmentalScore
    );
    
    const riskLevel = this.determineRiskLevel(overallRiskScore);
    const mitigationStrategies = await this.generateMitigationStrategies(dependency, vulnerabilities, context, riskLevel);
    const priority = this.calculatePriority(overallRiskScore, riskLevel, context);
    
    const assessment: RiskAssessment = {
      id: this.generateAssessmentId(),
      dependencyId: `${dependency.name}@${dependency.version}`,
      tenantId,
      assessmentDate: new Date(),
      overallRiskScore,
      riskLevel,
      riskFactors,
      businessImpactScore,
      technicalRiskScore,
      exploitabilityScore,
      environmentalScore,
      mitigationStrategies,
      priority,
      assessedBy,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      lastUpdated: new Date()
    };
    
    this.assessments.set(assessment.id, assessment);
    
    this.emit('riskAssessed', {
      assessmentId: assessment.id,
      dependency: dependency.name,
      riskLevel,
      riskScore: overallRiskScore
    });
    
    return assessment;
  }

  private async calculateRiskFactors(
    dependency: Dependency,
    vulnerabilities: Vulnerability[],
    context: BusinessContext
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];
    
    // Vulnerability-based risk factors
    for (const vuln of vulnerabilities) {
      factors.push({
        id: this.generateFactorId(),
        category: 'VULNERABILITY',
        type: 'SECURITY_VULNERABILITY',
        description: `${vuln.severity} severity vulnerability: ${vuln.title}`,
        severity: vuln.severity,
        weight: this.assessmentCriteria.vulnerabilityWeights[vuln.severity.toLowerCase()],
        score: this.mapSeverityToScore(vuln.severity),
        weightedScore: 0, // Will be calculated
        evidence: [`CVE: ${vuln.cve}`, `CVSS: ${vuln.cvssScore}`].filter(Boolean),
        source: vuln.dataSource,
        detectedAt: new Date()
      });
    }
    
    // Dependency-based risk factors
    factors.push(...await this.calculateDependencyRiskFactors(dependency));
    
    // Environment-based risk factors
    factors.push(...this.calculateEnvironmentalRiskFactors(context));
    
    // Business-based risk factors
    factors.push(...this.calculateBusinessRiskFactors(context));
    
    // Calculate weighted scores
    factors.forEach(factor => {
      factor.weightedScore = factor.score * factor.weight;
    });
    
    return factors;
  }

  private async calculateDependencyRiskFactors(dependency: Dependency): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];
    
    // Direct vs Transitive dependency
    factors.push({
      id: this.generateFactorId(),
      category: 'DEPENDENCY',
      type: 'DEPENDENCY_TYPE',
      description: `${dependency.type.charAt(0).toUpperCase() + dependency.type.slice(1)} dependency`,
      severity: dependency.type === 'direct' ? 'HIGH' : 'MEDIUM',
      weight: this.assessmentCriteria.dependencyFactors[`${dependency.type}Dependency`],
      score: dependency.type === 'direct' ? 80 : 60,
      weightedScore: 0,
      evidence: [`Type: ${dependency.type}`, `Scope: ${dependency.scope}`],
      source: 'dependency-analysis',
      detectedAt: new Date()
    });
    
    // Maintenance status (mock data - would be fetched from package registries)
    const maintenanceScore = await this.assessMaintenanceStatus(dependency);
    factors.push({
      id: this.generateFactorId(),
      category: 'DEPENDENCY',
      type: 'MAINTENANCE_STATUS',
      description: `Package maintenance status: ${maintenanceScore > 70 ? 'Well maintained' : maintenanceScore > 40 ? 'Moderately maintained' : 'Poorly maintained'}`,
      severity: maintenanceScore > 70 ? 'LOW' : maintenanceScore > 40 ? 'MEDIUM' : 'HIGH',
      weight: this.assessmentCriteria.dependencyFactors.maintenanceStatus,
      score: 100 - maintenanceScore,
      weightedScore: 0,
      evidence: [`Maintenance score: ${maintenanceScore}`],
      source: 'package-registry',
      detectedAt: new Date()
    });
    
    // Package age
    const ageScore = this.calculatePackageAgeScore(dependency);
    factors.push({
      id: this.generateFactorId(),
      category: 'DEPENDENCY',
      type: 'PACKAGE_AGE',
      description: `Package age assessment`,
      severity: ageScore > 80 ? 'HIGH' : ageScore > 60 ? 'MEDIUM' : 'LOW',
      weight: this.assessmentCriteria.dependencyFactors.ageScore,
      score: ageScore,
      weightedScore: 0,
      evidence: [`Version: ${dependency.version}`, `Last update: ${dependency.lastUpdate || 'Unknown'}`],
      source: 'dependency-analysis',
      detectedAt: new Date()
    });
    
    // License risk
    const licenseRisk = this.assessLicenseRisk(dependency.licenses);
    if (licenseRisk.score > 0) {
      factors.push({
        id: this.generateFactorId(),
        category: 'DEPENDENCY',
        type: 'LICENSE_RISK',
        description: licenseRisk.description,
        severity: licenseRisk.severity,
        weight: this.assessmentCriteria.dependencyFactors.licenseRisk,
        score: licenseRisk.score,
        weightedScore: 0,
        evidence: [`Licenses: ${dependency.licenses.join(', ')}`],
        source: 'license-analysis',
        detectedAt: new Date()
      });
    }
    
    return factors;
  }

  private calculateEnvironmentalRiskFactors(context: BusinessContext): RiskFactor[] {
    const factors: RiskFactor[] = [];
    
    factors.push({
      id: this.generateFactorId(),
      category: 'ENVIRONMENT',
      type: 'ENVIRONMENT_TYPE',
      description: `Deployed in ${context.environmentType.toLowerCase()} environment`,
      severity: context.environmentType === 'PRODUCTION' ? 'HIGH' : context.environmentType === 'STAGING' ? 'MEDIUM' : 'LOW',
      weight: this.assessmentCriteria.environmentalFactors[context.environmentType.toLowerCase()],
      score: this.mapEnvironmentToScore(context.environmentType),
      weightedScore: 0,
      evidence: [`Environment: ${context.environmentType}`],
      source: 'environment-analysis',
      detectedAt: new Date()
    });
    
    // Data classification risk
    factors.push({
      id: this.generateFactorId(),
      category: 'ENVIRONMENT',
      type: 'DATA_CLASSIFICATION',
      description: `Processes ${context.dataClassification.toLowerCase()} data`,
      severity: this.mapDataClassificationToSeverity(context.dataClassification),
      weight: 1.0,
      score: this.mapDataClassificationToScore(context.dataClassification),
      weightedScore: 0,
      evidence: [`Data classification: ${context.dataClassification}`],
      source: 'data-classification',
      detectedAt: new Date()
    });
    
    return factors;
  }

  private calculateBusinessRiskFactors(context: BusinessContext): RiskFactor[] {
    const factors: RiskFactor[] = [];
    
    factors.push({
      id: this.generateFactorId(),
      category: 'BUSINESS',
      type: 'APPLICATION_CRITICALITY',
      description: `${context.applicationCriticality.toLowerCase()} criticality application`,
      severity: context.applicationCriticality === 'CRITICAL' ? 'CRITICAL' : context.applicationCriticality,
      weight: this.assessmentCriteria.businessFactors[`${context.applicationCriticality.toLowerCase()}Application`],
      score: this.mapCriticalityToScore(context.applicationCriticality),
      weightedScore: 0,
      evidence: [`Criticality: ${context.applicationCriticality}`],
      source: 'business-context',
      detectedAt: new Date()
    });
    
    // Regulatory requirements
    if (context.regulatoryRequirements.length > 0) {
      factors.push({
        id: this.generateFactorId(),
        category: 'BUSINESS',
        type: 'REGULATORY_COMPLIANCE',
        description: `Subject to regulatory requirements: ${context.regulatoryRequirements.join(', ')}`,
        severity: context.regulatoryRequirements.some(req => ['SOX', 'PCI-DSS', 'GDPR', 'HIPAA'].includes(req)) ? 'HIGH' : 'MEDIUM',
        weight: 1.5,
        score: context.regulatoryRequirements.length * 20,
        weightedScore: 0,
        evidence: [`Regulations: ${context.regulatoryRequirements.join(', ')}`],
        source: 'regulatory-analysis',
        detectedAt: new Date()
      });
    }
    
    return factors;
  }

  private calculateBusinessImpactScore(factors: RiskFactor[], context: BusinessContext): number {
    const businessFactors = factors.filter(f => f.category === 'BUSINESS');
    const environmentFactors = factors.filter(f => f.category === 'ENVIRONMENT');
    
    let score = 0;
    let totalWeight = 0;
    
    [...businessFactors, ...environmentFactors].forEach(factor => {
      score += factor.weightedScore;
      totalWeight += factor.weight;
    });
    
    return totalWeight > 0 ? Math.min(100, score / totalWeight) : 0;
  }

  private calculateTechnicalRiskScore(factors: RiskFactor[], vulnerabilities: Vulnerability[]): number {
    const vulnerabilityFactors = factors.filter(f => f.category === 'VULNERABILITY');
    const dependencyFactors = factors.filter(f => f.category === 'DEPENDENCY');
    
    let score = 0;
    let totalWeight = 0;
    
    [...vulnerabilityFactors, ...dependencyFactors].forEach(factor => {
      score += factor.weightedScore;
      totalWeight += factor.weight;
    });
    
    return totalWeight > 0 ? Math.min(100, score / totalWeight) : 0;
  }

  private calculateExploitabilityScore(vulnerabilities: Vulnerability[]): number {
    if (vulnerabilities.length === 0) return 0;
    
    let maxExploitability = 0;
    
    vulnerabilities.forEach(vuln => {
      const exploitabilityLevel = vuln.exploitability || 'NOT_DEFINED';
      const score = this.assessmentCriteria.exploitabilityFactors[exploitabilityLevel.toLowerCase()] || 1.0;
      maxExploitability = Math.max(maxExploitability, score * 50); // Base score of 50
    });
    
    return Math.min(100, maxExploitability);
  }

  private calculateEnvironmentalScore(context: BusinessContext): number {
    const envMultiplier = this.assessmentCriteria.environmentalFactors[context.environmentType.toLowerCase()];
    const dataMultiplier = this.mapDataClassificationToScore(context.dataClassification) / 100;
    
    return Math.min(100, (envMultiplier + dataMultiplier) * 50);
  }

  private calculateOverallRiskScore(
    businessImpact: number,
    technicalRisk: number,
    exploitability: number,
    environmental: number
  ): number {
    // Weighted average with different weights for each component
    const weights = {
      business: 0.25,
      technical: 0.35,
      exploitability: 0.25,
      environmental: 0.15
    };
    
    return Math.round(
      businessImpact * weights.business +
      technicalRisk * weights.technical +
      exploitability * weights.exploitability +
      environmental * weights.environmental
    );
  }

  private determineRiskLevel(riskScore: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL' {
    if (riskScore >= 90) return 'CRITICAL';
    if (riskScore >= 70) return 'HIGH';
    if (riskScore >= 50) return 'MEDIUM';
    if (riskScore >= 30) return 'LOW';
    return 'MINIMAL';
  }

  private async generateMitigationStrategies(
    dependency: Dependency,
    vulnerabilities: Vulnerability[],
    context: BusinessContext,
    riskLevel: string
  ): Promise<MitigationStrategy[]> {
    const strategies: MitigationStrategy[] = [];
    
    // Update strategy
    if (vulnerabilities.some(v => v.fixAvailable)) {
      strategies.push({
        id: this.generateStrategyId(),
        type: 'UPDATE',
        description: `Update ${dependency.name} to a patched version`,
        effort: this.determineUpdateEffort(dependency),
        cost: this.determineUpdateCost(dependency, context),
        timeline: this.determineUpdateTimeline(riskLevel, context),
        effectiveness: 95,
        feasibility: this.determineUpdateFeasibility(dependency),
        recommendedAction: `Update to latest secure version`,
        prerequisites: ['Test in staging environment', 'Review breaking changes'],
        risks: ['Potential breaking changes', 'Integration issues'],
        benefits: ['Eliminates known vulnerabilities', 'Access to latest features'],
        priority: 1
      });
    }
    
    // Replace strategy
    if (riskLevel === 'CRITICAL' && !vulnerabilities.some(v => v.fixAvailable)) {
      strategies.push({
        id: this.generateStrategyId(),
        type: 'REPLACE',
        description: `Replace ${dependency.name} with a secure alternative`,
        effort: 'HIGH',
        cost: 'HIGH',
        timeline: this.determineReplacementTimeline(context),
        effectiveness: 100,
        feasibility: this.determineReplacementFeasibility(dependency),
        recommendedAction: `Evaluate and migrate to secure alternative`,
        prerequisites: ['Research alternatives', 'Plan migration strategy', 'Update integration code'],
        risks: ['High development effort', 'Potential feature differences'],
        benefits: ['Eliminates vulnerable dependency', 'Potentially better maintained'],
        priority: 2
      });
    }
    
    // Configuration strategy
    if (this.hasConfigurationMitigation(vulnerabilities)) {
      strategies.push({
        id: this.generateStrategyId(),
        type: 'CONFIGURE',
        description: `Apply configuration changes to mitigate risk`,
        effort: 'LOW',
        cost: 'LOW',
        timeline: 'Immediate',
        effectiveness: 60,
        feasibility: 85,
        recommendedAction: `Apply security configuration`,
        prerequisites: ['Review current configuration'],
        risks: ['Partial mitigation only'],
        benefits: ['Quick implementation', 'Low cost'],
        priority: 3
      });
    }
    
    // Monitor strategy (always available as fallback)
    strategies.push({
      id: this.generateStrategyId(),
      type: 'MONITOR',
      description: `Enhanced monitoring for ${dependency.name}`,
      effort: 'LOW',
      cost: 'LOW',
      timeline: 'Immediate',
      effectiveness: 30,
      feasibility: 95,
      recommendedAction: `Implement enhanced monitoring and alerting`,
      prerequisites: ['Set up monitoring rules'],
      risks: ['Reactive approach only'],
      benefits: ['Early detection of issues', 'Low implementation cost'],
      priority: 4
    });
    
    return strategies.sort((a, b) => a.priority - b.priority);
  }

  private calculatePriority(riskScore: number, riskLevel: string, context: BusinessContext): number {
    let priority = riskScore;
    
    // Adjust based on environment
    if (context.environmentType === 'PRODUCTION') priority += 20;
    else if (context.environmentType === 'STAGING') priority += 10;
    
    // Adjust based on criticality
    if (context.applicationCriticality === 'CRITICAL') priority += 15;
    else if (context.applicationCriticality === 'HIGH') priority += 10;
    
    // Adjust based on regulatory requirements
    if (context.regulatoryRequirements.length > 0) priority += 10;
    
    return Math.min(100, priority);
  }

  async prioritizeRiskAssessments(
    assessments: RiskAssessment[],
    tenantId: string
  ): Promise<PrioritizationResult[]> {
    const context = this.businessContexts.get(tenantId) || this.getDefaultBusinessContext(tenantId);
    
    const results: PrioritizationResult[] = [];
    
    for (const assessment of assessments) {
      const dependency = await this.getDependencyFromAssessment(assessment);
      const vulnerabilities = await this.getVulnerabilitiesFromAssessment(assessment);
      
      if (!dependency) continue;
      
      const topMitigation = assessment.mitigationStrategies[0];
      
      results.push({
        assessmentId: assessment.id,
        dependency,
        vulnerabilities,
        riskScore: assessment.overallRiskScore,
        priority: assessment.priority,
        recommendedAction: topMitigation?.recommendedAction || 'Monitor',
        timeline: topMitigation?.timeline || 'TBD',
        effort: topMitigation?.effort || 'UNKNOWN',
        justification: this.generatePriorityJustification(assessment, context)
      });
    }
    
    // Sort by priority (highest first)
    results.sort((a, b) => b.priority - a.priority);
    
    return results;
  }

  private generatePriorityJustification(assessment: RiskAssessment, context: BusinessContext): string {
    const reasons: string[] = [];
    
    if (assessment.riskLevel === 'CRITICAL') {
      reasons.push('Critical risk level');
    }
    
    if (context.environmentType === 'PRODUCTION') {
      reasons.push('Production environment');
    }
    
    if (context.applicationCriticality === 'CRITICAL') {
      reasons.push('Critical application');
    }
    
    const highSeverityFactors = assessment.riskFactors.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
    if (highSeverityFactors.length > 0) {
      reasons.push(`${highSeverityFactors.length} high-severity factors`);
    }
    
    if (context.regulatoryRequirements.length > 0) {
      reasons.push('Regulatory compliance requirements');
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Standard risk assessment priority';
  }

  // Helper methods for risk calculation
  private async assessMaintenanceStatus(dependency: Dependency): Promise<number> {
    // Mock implementation - would query package registries
    const baseScore = Math.random() * 40 + 40; // 40-80
    
    // Adjust based on last update
    if (dependency.lastUpdate) {
      const daysSinceUpdate = (Date.now() - dependency.lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 365) baseScore -= 20; // Heavily penalize old packages
      else if (daysSinceUpdate > 180) baseScore -= 10;
    }
    
    return Math.max(0, Math.min(100, baseScore));
  }

  private calculatePackageAgeScore(dependency: Dependency): number {
    // Mock implementation - would parse version numbers and release dates
    if (dependency.version === '*') return 50;
    
    const versionParts = dependency.version.replace(/[^\d.]/g, '').split('.');
    const majorVersion = parseInt(versionParts[0] || '1');
    
    // Higher major versions are generally newer
    if (majorVersion === 0) return 70; // Pre-1.0 versions are riskier
    if (majorVersion >= 3) return 20; // Mature versions
    return 40; // Moderate age
  }

  private assessLicenseRisk(licenses: string[]): { score: number; severity: string; description: string } {
    if (!licenses || licenses.length === 0) {
      return { score: 30, severity: 'MEDIUM', description: 'No license information available' };
    }
    
    const riskyLicenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0'];
    const hasRiskyLicense = licenses.some(license => riskyLicenses.includes(license));
    
    if (hasRiskyLicense) {
      return { score: 60, severity: 'HIGH', description: 'Contains copyleft license with potential commercial restrictions' };
    }
    
    return { score: 0, severity: 'LOW', description: 'Acceptable license terms' };
  }

  private mapSeverityToScore(severity: string): number {
    const scores = { CRITICAL: 100, HIGH: 75, MEDIUM: 50, LOW: 25, INFO: 5 };
    return scores[severity] || 25;
  }

  private mapEnvironmentToScore(environment: string): number {
    const scores = { PRODUCTION: 100, STAGING: 75, DEVELOPMENT: 50, TEST: 25 };
    return scores[environment] || 50;
  }

  private mapDataClassificationToSeverity(classification: string): string {
    const mapping = { RESTRICTED: 'CRITICAL', CONFIDENTIAL: 'HIGH', INTERNAL: 'MEDIUM', PUBLIC: 'LOW' };
    return mapping[classification] || 'MEDIUM';
  }

  private mapDataClassificationToScore(classification: string): number {
    const scores = { RESTRICTED: 100, CONFIDENTIAL: 75, INTERNAL: 50, PUBLIC: 25 };
    return scores[classification] || 50;
  }

  private mapCriticalityToScore(criticality: string): number {
    const scores = { CRITICAL: 100, HIGH: 75, MEDIUM: 50, LOW: 25 };
    return scores[criticality] || 50;
  }

  private determineUpdateEffort(dependency: Dependency): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (dependency.type === 'transitive') return 'LOW';
    if (dependency.scope === 'development') return 'LOW';
    return 'MEDIUM';
  }

  private determineUpdateCost(dependency: Dependency, context: BusinessContext): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (context.environmentType === 'DEVELOPMENT') return 'LOW';
    if (dependency.type === 'transitive') return 'LOW';
    return 'MEDIUM';
  }

  private determineUpdateTimeline(riskLevel: string, context: BusinessContext): string {
    if (riskLevel === 'CRITICAL') {
      return context.environmentType === 'PRODUCTION' ? '24-48 hours' : 'Immediate';
    } else if (riskLevel === 'HIGH') {
      return '1-2 weeks';
    } else if (riskLevel === 'MEDIUM') {
      return '2-4 weeks';
    }
    return 'Next maintenance window';
  }

  private determineUpdateFeasibility(dependency: Dependency): number {
    // Base feasibility
    let feasibility = 80;
    
    // Adjust based on dependency type
    if (dependency.type === 'transitive') feasibility += 10;
    if (dependency.scope === 'development') feasibility += 10;
    
    return Math.min(100, feasibility);
  }

  private determineReplacementTimeline(context: BusinessContext): string {
    if (context.environmentType === 'PRODUCTION') return '4-8 weeks';
    return '2-4 weeks';
  }

  private determineReplacementFeasibility(dependency: Dependency): number {
    // Base feasibility for replacement is lower
    let feasibility = 50;
    
    // Adjust based on dependency characteristics
    if (dependency.type === 'transitive') feasibility += 20;
    if (dependency.scope === 'development') feasibility += 15;
    
    return Math.min(100, feasibility);
  }

  private hasConfigurationMitigation(vulnerabilities: Vulnerability[]): boolean {
    // Check if any vulnerabilities can be mitigated through configuration
    return vulnerabilities.some(vuln => 
      vuln.description.toLowerCase().includes('configuration') ||
      vuln.description.toLowerCase().includes('setting') ||
      vuln.cwe?.some(cwe => ['CWE-16', 'CWE-15'].includes(cwe))
    );
  }

  private getDefaultBusinessContext(tenantId: string): BusinessContext {
    return {
      tenantId,
      applicationCriticality: 'MEDIUM',
      environmentType: 'PRODUCTION',
      dataClassification: 'INTERNAL',
      regulatoryRequirements: [],
      businessOperatingHours: {
        timezone: 'UTC',
        operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '09:00',
        endTime: '17:00'
      },
      maintenanceWindows: [],
      stakeholders: [],
      complianceFrameworks: []
    };
  }

  private async getDependencyFromAssessment(assessment: RiskAssessment): Promise<Dependency | null> {
    // Mock implementation - would retrieve dependency from inventory
    const [name, version] = assessment.dependencyId.split('@');
    return {
      name,
      version,
      type: 'direct',
      scope: 'production',
      ecosystem: 'npm',
      packageFile: '',
      licenses: [],
      dependsOn: [],
      dependedOnBy: []
    };
  }

  private async getVulnerabilitiesFromAssessment(assessment: RiskAssessment): Promise<Vulnerability[]> {
    // Mock implementation - would retrieve vulnerabilities from scan results
    return [];
  }

  private generateAssessmentId(): string {
    return `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFactorId(): string {
    return `factor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStrategyId(): string {
    return `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  setBusinessContext(tenantId: string, context: BusinessContext): void {
    this.businessContexts.set(tenantId, context);
    this.emit('businessContextUpdated', { tenantId });
  }

  getBusinessContext(tenantId: string): BusinessContext | undefined {
    return this.businessContexts.get(tenantId);
  }

  updateAssessmentCriteria(criteria: Partial<RiskAssessmentCriteria>): void {
    this.assessmentCriteria = { ...this.assessmentCriteria, ...criteria };
    this.emit('criteriaUpdated', criteria);
  }

  getAssessment(assessmentId: string): RiskAssessment | undefined {
    return this.assessments.get(assessmentId);
  }

  getAssessmentsByTenant(tenantId: string): RiskAssessment[] {
    return Array.from(this.assessments.values())
      .filter(a => a.tenantId === tenantId);
  }

  getHighRiskAssessments(tenantId?: string): RiskAssessment[] {
    const assessments = tenantId 
      ? this.getAssessmentsByTenant(tenantId)
      : Array.from(this.assessments.values());
    
    return assessments.filter(a => 
      a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH'
    ).sort((a, b) => b.priority - a.priority);
  }

  async reassessRisk(assessmentId: string): Promise<RiskAssessment> {
    const existing = this.assessments.get(assessmentId);
    if (!existing) {
      throw new Error(`Assessment not found: ${assessmentId}`);
    }
    
    // Would re-fetch dependency and vulnerability data for reassessment
    throw new Error('Reassessment not yet implemented');
  }

  getRiskMetrics(tenantId?: string): any {
    const assessments = tenantId 
      ? this.getAssessmentsByTenant(tenantId)
      : Array.from(this.assessments.values());
    
    const total = assessments.length;
    const byRiskLevel = assessments.reduce((acc, assessment) => {
      acc[assessment.riskLevel] = (acc[assessment.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const avgRiskScore = assessments.reduce((sum, a) => sum + a.overallRiskScore, 0) / Math.max(1, total);
    const expiredAssessments = assessments.filter(a => a.validUntil < new Date()).length;
    
    return {
      total,
      byRiskLevel,
      avgRiskScore: Math.round(avgRiskScore),
      expiredAssessments,
      assessmentAge: {
        recent: assessments.filter(a => (Date.now() - a.assessmentDate.getTime()) <= 7 * 24 * 60 * 60 * 1000).length,
        week: assessments.filter(a => {
          const age = Date.now() - a.assessmentDate.getTime();
          return age > 7 * 24 * 60 * 60 * 1000 && age <= 30 * 24 * 60 * 60 * 1000;
        }).length,
        month: assessments.filter(a => (Date.now() - a.assessmentDate.getTime()) > 30 * 24 * 60 * 60 * 1000).length
      }
    };
  }
}
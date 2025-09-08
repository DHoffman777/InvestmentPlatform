import { EventEmitter } from 'events';
import { Dependency } from './DependencyInventoryService';
import { Vulnerability, VulnerabilityMatch } from './VulnerabilityDatabaseService';
import { RiskAssessment, BusinessContext } from './RiskAssessmentService';

export interface UpdateRecommendation {
  id: string;
  dependencyId: string;
  tenantId: string;
  currentVersion: string;
  recommendedVersion: string;
  updateType: 'PATCH' | 'MINOR' | 'MAJOR' | 'REPLACE';
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0-100
  reason: string;
  description: string;
  securityImpact: SecurityImpact;
  compatibilityRisk: CompatibilityRisk;
  effortEstimate: EffortEstimate;
  timeline: string;
  dependencies: DependencyImpact[];
  testingRequirements: TestingRequirement[];
  rollbackPlan: RollbackPlan;
  approvalRequired: boolean;
  createdAt: Date;
  validUntil: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED' | 'SUPERSEDED';
}

export interface SecurityImpact {
  vulnerabilitiesFixed: string[];
  securityScore: number;
  riskReduction: number;
  newVulnerabilities: string[];
  complianceImpact: string[];
}

export interface CompatibilityRisk {
  breakingChanges: BreakingChange[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impactedFeatures: string[];
  migrationRequired: boolean;
  testingScope: string[];
}

export interface BreakingChange {
  type: 'API' | 'BEHAVIOR' | 'DEPENDENCY' | 'CONFIGURATION' | 'REMOVAL';
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  migrationPath?: string;
  workaround?: string;
}

export interface EffortEstimate {
  developmentHours: number;
  testingHours: number;
  deploymentHours: number;
  totalHours: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  skillsRequired: string[];
  resourcesNeeded: string[];
}

export interface DependencyImpact {
  name: string;
  currentVersion: string;
  newVersion: string;
  changeType: 'UPDATED' | 'ADDED' | 'REMOVED';
  transitiveChanges: TransitiveChange[];
}

export interface TransitiveChange {
  dependencyName: string;
  oldVersion: string;
  newVersion: string;
  impact: 'BENEFICIAL' | 'NEUTRAL' | 'CONCERNING';
}

export interface TestingRequirement {
  type: 'UNIT' | 'INTEGRATION' | 'E2E' | 'SECURITY' | 'PERFORMANCE' | 'COMPATIBILITY';
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedHours: number;
  automatable: boolean;
}

export interface RollbackPlan {
  strategy: 'VERSION_ROLLBACK' | 'CONFIGURATION_REVERT' | 'FEATURE_FLAG' | 'CANARY_ROLLBACK';
  steps: RollbackStep[];
  estimatedTime: number;
  riskAssessment: string;
  prerequisites: string[];
}

export interface RollbackStep {
  order: number;
  description: string;
  command?: string;
  validationCriteria: string;
  estimatedTime: number;
}

export interface UpdateBatch {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  recommendations: string[];
  batchType: 'SECURITY' | 'MAINTENANCE' | 'FEATURE' | 'MIXED';
  scheduledDate?: Date;
  estimatedDuration: number;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  dependencies: BatchDependency[];
  prerequisites: string[];
  rollbackPlan: RollbackPlan;
  createdAt: Date;
  createdBy: string;
}

export interface BatchDependency {
  from: string;
  to: string;
  reason: string;
}

export interface VersionInfo {
  version: string;
  releaseDate: Date;
  isLatest: boolean;
  isSecure: boolean;
  vulnerabilities: string[];
  changelogUrl?: string;
  breakingChanges: string[];
  features: string[];
  fixes: string[];
  securityFixes: string[];
  deprecations: string[];
}

export interface UpdateStrategy {
  tenantId: string;
  strategy: 'AGGRESSIVE' | 'BALANCED' | 'CONSERVATIVE' | 'SECURITY_ONLY';
  autoApprovalRules: AutoApprovalRule[];
  testingRequirements: TestingConfig;
  rolloutConfig: RolloutConfig;
  notificationConfig: NotificationConfig;
}

export interface AutoApprovalRule {
  condition: 'PATCH_SECURITY' | 'MINOR_NO_BREAKING' | 'DEV_DEPENDENCIES' | 'LOW_RISK';
  maxRiskScore: number;
  requiresTests: boolean;
  environments: string[];
}

export interface TestingConfig {
  mandatory: string[];
  optional: string[];
  customRules: TestingRule[];
}

export interface TestingRule {
  condition: string;
  requiredTests: string[];
  estimatedHours: number;
}

export interface RolloutConfig {
  strategy: 'IMMEDIATE' | 'STAGED' | 'CANARY' | 'BLUE_GREEN';
  stages: RolloutStage[];
  rollbackTriggers: string[];
  monitoringPeriod: number;
}

export interface RolloutStage {
  name: string;
  percentage: number;
  duration: number;
  successCriteria: string[];
  failureCriteria: string[];
}

export interface NotificationConfig {
  channels: string[];
  events: string[];
  stakeholders: string[];
}

export class UpdateRecommendationEngine extends EventEmitter {
  private recommendations: Map<string, UpdateRecommendation> = new Map();
  private batches: Map<string, UpdateBatch> = new Map();
  private strategies: Map<string, UpdateStrategy> = new Map();
  private versionCache: Map<string, VersionInfo[]> = new Map();

  constructor() {
    super();
  }

  async generateRecommendations(
    dependencies: Dependency[],
    vulnerabilities: VulnerabilityMatch[],
    riskAssessments: RiskAssessment[],
    tenantId: string,
    businessContext?: BusinessContext
  ): Promise<UpdateRecommendation[]> {
    const recommendations: UpdateRecommendation[] = [];
    const strategy = this.strategies.get(tenantId) || this.getDefaultStrategy(tenantId);

    for (const dependency of dependencies) {
      try {
        const dependencyVulns = vulnerabilities.filter(v => v.dependency.name === dependency.name);
        const riskAssessment = riskAssessments.find(r => r.dependencyId === `${dependency.name}@${dependency.version}`);
        
        const recommendation = await this.analyzeUpdate(
          dependency,
          dependencyVulns,
          riskAssessment,
          tenantId,
          strategy,
          businessContext
        );
        
        if (recommendation) {
          recommendations.push(recommendation);
          this.recommendations.set(recommendation.id, recommendation);
        }
      } catch (error: any) {
        this.emit('recommendationError', {
          dependency: dependency.name,
          error: error.message
        });
      }
    }

    // Sort by urgency and confidence
    recommendations.sort((a, b) => {
      const urgencyOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.confidence - a.confidence;
    });

    this.emit('recommendationsGenerated', {
      tenantId,
      count: recommendations.length,
      critical: recommendations.filter(r => r.urgency === 'CRITICAL').length
    });

    return recommendations;
  }

  private async analyzeUpdate(
    dependency: Dependency,
    vulnerabilities: VulnerabilityMatch[],
    riskAssessment: RiskAssessment | undefined,
    tenantId: string,
    strategy: UpdateStrategy,
    businessContext?: BusinessContext
  ): Promise<UpdateRecommendation | null> {
    // Get available versions
    const availableVersions = await this.getAvailableVersions(dependency);
    if (availableVersions.length === 0) return null;

    // Find best update candidate
    const candidate = this.findBestUpdateCandidate(
      dependency,
      availableVersions,
      vulnerabilities,
      strategy
    );

    if (!candidate || candidate.version === dependency.version) return null;

    // Analyze the update
    const securityImpact = await this.analyzeSecurityImpact(dependency, candidate, vulnerabilities);
    const compatibilityRisk = await this.analyzeCompatibilityRisk(dependency, candidate);
    const effortEstimate = await this.estimateEffort(dependency, candidate, compatibilityRisk);
    const dependencyImpacts = await this.analyzeDependencyImpacts(dependency, candidate);
    const testingRequirements = this.generateTestingRequirements(dependency, candidate, compatibilityRisk);
    const rollbackPlan = this.createRollbackPlan(dependency, candidate);

    const urgency = this.determineUrgency(vulnerabilities, riskAssessment, securityImpact);
    const confidence = this.calculateConfidence(candidate, compatibilityRisk, securityImpact);
    const timeline = this.estimateTimeline(urgency, effortEstimate, businessContext);

    const recommendation: UpdateRecommendation = {
      id: this.generateRecommendationId(),
      dependencyId: `${dependency.name}@${dependency.version}`,
      tenantId,
      currentVersion: dependency.version,
      recommendedVersion: candidate.version,
      updateType: this.determineUpdateType(dependency.version, candidate.version),
      urgency,
      confidence,
      reason: this.generateReason(vulnerabilities, candidate, securityImpact),
      description: this.generateDescription(dependency, candidate, securityImpact, compatibilityRisk),
      securityImpact,
      compatibilityRisk,
      effortEstimate,
      timeline,
      dependencies: dependencyImpacts,
      testingRequirements,
      rollbackPlan,
      approvalRequired: this.requiresApproval(candidate, compatibilityRisk, strategy),
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'PENDING'
    };

    return recommendation;
  }

  private async getAvailableVersions(dependency: Dependency): Promise<VersionInfo[]> {
    const cacheKey = `${dependency.ecosystem}:${dependency.name}`;
    let versions = this.versionCache.get(cacheKey);

    if (!versions) {
      versions = await this.fetchVersionsFromRegistry(dependency);
      this.versionCache.set(cacheKey, versions);
      
      // Cache for 1 hour
      setTimeout(() => this.versionCache.delete(cacheKey), 3600000);
    }

    return versions;
  }

  private async fetchVersionsFromRegistry(dependency: Dependency): Promise<VersionInfo[]> {
    // Mock implementation - would query package registries
    const mockVersions: VersionInfo[] = [];
    
    // Generate some mock versions based on current version
    const currentParts = dependency.version.replace(/[^\d.]/g, '').split('.').map(Number);
    const [major = 1, minor = 0, patch = 0] = currentParts;

    // Add patch versions
    for (let p = patch + 1; p <= patch + 3; p++) {
      mockVersions.push({
        version: `${major}.${minor}.${p}`,
        releaseDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        isLatest: false,
        isSecure: Math.random() > 0.3,
        vulnerabilities: Math.random() > 0.7 ? [`CVE-2024-${Math.floor(Math.random() * 10000)}`] : [],
        breakingChanges: [],
        features: [],
        fixes: [`Fix #${Math.floor(Math.random() * 1000)}`],
        securityFixes: Math.random() > 0.5 ? [`Security fix for vulnerability`] : [],
        deprecations: []
      });
    }

    // Add minor version
    mockVersions.push({
      version: `${major}.${minor + 1}.0`,
      releaseDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      isLatest: false,
      isSecure: true,
      vulnerabilities: [],
      breakingChanges: Math.random() > 0.7 ? ['API signature change'] : [],
      features: [`New feature ${Math.floor(Math.random() * 100)}`],
      fixes: [],
      securityFixes: ['Enhanced security'],
      deprecations: Math.random() > 0.8 ? ['Deprecated old API'] : []
    });

    // Mark latest
    if (mockVersions.length > 0) {
      mockVersions[mockVersions.length - 1].isLatest = true;
    }

    return mockVersions.sort((a, b) => this.compareVersions(b.version, a.version));
  }

  private findBestUpdateCandidate(
    dependency: Dependency,
    availableVersions: VersionInfo[],
    vulnerabilities: VulnerabilityMatch[],
    strategy: UpdateStrategy
  ): VersionInfo | null {
    const hasSecurityVulns = vulnerabilities.some(v => v.vulnerability.severity === 'CRITICAL' || v.vulnerability.severity === 'HIGH');
    
    // Filter versions based on strategy
    let candidates = availableVersions.filter(v => this.compareVersions(v.version, dependency.version) > 0);
    
    switch (strategy.strategy) {
      case 'SECURITY_ONLY':
        candidates = candidates.filter(v => v.securityFixes.length > 0 || v.isSecure);
        break;
      case 'CONSERVATIVE':
        candidates = candidates.filter(v => {
          const updateType = this.determineUpdateType(dependency.version, v.version);
          return updateType === 'PATCH' || (updateType === 'MINOR' && v.breakingChanges.length === 0);
        });
        break;
      case 'AGGRESSIVE':
        // Include all newer versions
        break;
      case 'BALANCED':
      default:
        candidates = candidates.filter(v => {
          const updateType = this.determineUpdateType(dependency.version, v.version);
          return updateType !== 'MAJOR' || hasSecurityVulns;
        });
        break;
    }

    if (candidates.length === 0) return null;

    // Score candidates
    const scoredCandidates = candidates.map(candidate => ({
      version: candidate,
      score: this.scoreUpdateCandidate(dependency, candidate, vulnerabilities, hasSecurityVulns)
    }));

    // Return highest scoring candidate
    scoredCandidates.sort((a, b) => b.score - a.score);
    return scoredCandidates[0].version;
  }

  private scoreUpdateCandidate(
    dependency: Dependency,
    candidate: VersionInfo,
    vulnerabilities: VulnerabilityMatch[],
    hasSecurityVulns: boolean
  ): number {
    let score = 0;

    // Security fixes boost
    if (hasSecurityVulns && candidate.securityFixes.length > 0) {
      score += 100;
    }

    // Secure version boost
    if (candidate.isSecure && !hasSecurityVulns) {
      score += 50;
    }

    // Penalize breaking changes
    score -= candidate.breakingChanges.length * 30;

    // Reward recent releases (but not too recent)
    const daysSinceRelease = (Date.now() - candidate.releaseDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceRelease >= 7 && daysSinceRelease <= 90) {
      score += 20;
    } else if (daysSinceRelease < 7) {
      score -= 10; // Too new, might be unstable
    }

    // Prefer patch versions for stability
    const updateType = this.determineUpdateType(dependency.version, candidate.version);
    if (updateType === 'PATCH') score += 30;
    else if (updateType === 'MINOR') score += 10;
    else if (updateType === 'MAJOR') score -= 20;

    // Latest version bonus (but smaller)
    if (candidate.isLatest) score += 15;

    return score;
  }

  private async analyzeSecurityImpact(
    dependency: Dependency,
    candidate: VersionInfo,
    vulnerabilities: VulnerabilityMatch[]
  ): Promise<SecurityImpact> {
    const currentVulns = vulnerabilities.map(v => v.vulnerability.id);
    const fixedVulns = currentVulns.filter(() => Math.random() > 0.3); // Mock: assume 70% are fixed
    const newVulns = candidate.vulnerabilities;

    const securityScore = this.calculateSecurityScore(fixedVulns, newVulns, candidate.securityFixes);
    const riskReduction = fixedVulns.length * 20; // Mock calculation

    return {
      vulnerabilitiesFixed: fixedVulns,
      securityScore,
      riskReduction,
      newVulnerabilities: newVulns,
      complianceImpact: candidate.securityFixes.length > 0 ? ['Improves compliance posture'] : []
    };
  }

  private calculateSecurityScore(fixedVulns: string[], newVulns: string[], securityFixes: string[]): number {
    let score = 50; // Base score
    
    score += fixedVulns.length * 15; // Bonus for fixing vulnerabilities
    score -= newVulns.length * 10; // Penalty for new vulnerabilities
    score += securityFixes.length * 10; // Bonus for security fixes
    
    return Math.max(0, Math.min(100, score));
  }

  private async analyzeCompatibilityRisk(
    dependency: Dependency,
    candidate: VersionInfo
  ): Promise<CompatibilityRisk> {
    const updateType = this.determineUpdateType(dependency.version, candidate.version);
    const breakingChanges: BreakingChange[] = candidate.breakingChanges.map(change => ({
      type: 'API',
      description: change,
      impact: 'MEDIUM',
      migrationPath: 'Review API changes and update integration code'
    }));

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    
    if (updateType === 'MAJOR' || breakingChanges.length > 0) {
      riskLevel = 'HIGH';
    } else if (updateType === 'MINOR') {
      riskLevel = 'MEDIUM';
    }

    return {
      breakingChanges,
      riskLevel,
      impactedFeatures: breakingChanges.map(bc => bc.description),
      migrationRequired: breakingChanges.length > 0,
      testingScope: this.determineTestingScope(updateType, breakingChanges)
    };
  }

  private determineTestingScope(updateType: string, breakingChanges: BreakingChange[]): string[] {
    const scope = ['unit'];
    
    if (updateType === 'MINOR' || breakingChanges.length > 0) {
      scope.push('integration');
    }
    
    if (updateType === 'MAJOR' || breakingChanges.length > 2) {
      scope.push('e2e', 'performance');
    }
    
    return scope;
  }

  private async estimateEffort(
    dependency: Dependency,
    candidate: VersionInfo,
    compatibilityRisk: CompatibilityRisk
  ): Promise<EffortEstimate> {
    let developmentHours = 2; // Base effort
    let testingHours = 4;
    let deploymentHours = 1;

    // Adjust based on update type
    const updateType = this.determineUpdateType(dependency.version, candidate.version);
    if (updateType === 'MINOR') {
      developmentHours += 4;
      testingHours += 8;
    } else if (updateType === 'MAJOR') {
      developmentHours += 16;
      testingHours += 24;
      deploymentHours += 2;
    }

    // Adjust based on breaking changes
    developmentHours += compatibilityRisk.breakingChanges.length * 8;
    testingHours += compatibilityRisk.breakingChanges.length * 4;

    // Adjust based on dependency type
    if (dependency.type === 'direct') {
      developmentHours *= 1.5;
      testingHours *= 1.3;
    }

    const totalHours = developmentHours + testingHours + deploymentHours;
    let complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = 'LOW';

    if (totalHours > 40) complexity = 'VERY_HIGH';
    else if (totalHours > 20) complexity = 'HIGH';
    else if (totalHours > 10) complexity = 'MEDIUM';

    return {
      developmentHours: Math.round(developmentHours),
      testingHours: Math.round(testingHours),
      deploymentHours: Math.round(deploymentHours),
      totalHours: Math.round(totalHours),
      complexity,
      skillsRequired: this.determineSkillsRequired(updateType, compatibilityRisk),
      resourcesNeeded: this.determineResourcesNeeded(updateType, totalHours)
    };
  }

  private determineSkillsRequired(updateType: string, compatibilityRisk: CompatibilityRisk): string[] {
    const skills = ['Software Development'];
    
    if (updateType === 'MAJOR' || compatibilityRisk.migrationRequired) {
      skills.push('Migration Planning', 'API Integration');
    }
    
    if (compatibilityRisk.riskLevel === 'HIGH' || compatibilityRisk.riskLevel === 'CRITICAL') {
      skills.push('Risk Assessment', 'System Architecture');
    }
    
    return skills;
  }

  private determineResourcesNeeded(updateType: string, totalHours: number): string[] {
    const resources = ['Development Environment'];
    
    if (totalHours > 20) {
      resources.push('Staging Environment', 'Testing Framework');
    }
    
    if (updateType === 'MAJOR') {
      resources.push('Performance Testing Tools', 'Monitoring Tools');
    }
    
    return resources;
  }

  private async analyzeDependencyImpacts(
    dependency: Dependency,
    candidate: VersionInfo
  ): Promise<DependencyImpact[]> {
    // Mock implementation - would analyze transitive dependency changes
    const impacts: DependencyImpact[] = [];
    
    // Simulate some transitive changes
    for (let i = 0; i < Math.floor(Math.random() * 3); i++) {
      impacts.push({
        name: `transitive-dep-${i}`,
        currentVersion: '1.0.0',
        newVersion: '1.1.0',
        changeType: 'UPDATED',
        transitiveChanges: [{
          dependencyName: `nested-dep-${i}`,
          oldVersion: '2.0.0',
          newVersion: '2.1.0',
          impact: 'NEUTRAL'
        }]
      });
    }
    
    return impacts;
  }

  private generateTestingRequirements(
    dependency: Dependency,
    candidate: VersionInfo,
    compatibilityRisk: CompatibilityRisk
  ): TestingRequirement[] {
    const requirements: TestingRequirement[] = [];

    // Always require unit tests
    requirements.push({
      type: 'UNIT',
      description: 'Run existing unit test suite',
      priority: 'CRITICAL',
      estimatedHours: 2,
      automatable: true
    });

    // Integration tests for direct dependencies or breaking changes
    if (dependency.type === 'direct' || compatibilityRisk.breakingChanges.length > 0) {
      requirements.push({
        type: 'INTEGRATION',
        description: 'Test integration points and API contracts',
        priority: 'HIGH',
        estimatedHours: 4,
        automatable: true
      });
    }

    // Security testing for security fixes
    if (candidate.securityFixes.length > 0) {
      requirements.push({
        type: 'SECURITY',
        description: 'Verify security vulnerabilities are fixed',
        priority: 'HIGH',
        estimatedHours: 3,
        automatable: false
      });
    }

    // E2E tests for major updates
    const updateType = this.determineUpdateType(dependency.version, candidate.version);
    if (updateType === 'MAJOR') {
      requirements.push({
        type: 'E2E',
        description: 'End-to-end functionality verification',
        priority: 'HIGH',
        estimatedHours: 8,
        automatable: true
      });
    }

    return requirements;
  }

  private createRollbackPlan(dependency: Dependency, candidate: VersionInfo): RollbackPlan {
    const steps: RollbackStep[] = [
      {
        order: 1,
        description: `Revert ${dependency.name} to version ${dependency.version}`,
        command: `npm install ${dependency.name}@${dependency.version}`,
        validationCriteria: 'Package version matches expected version',
        estimatedTime: 5
      },
      {
        order: 2,
        description: 'Restart application services',
        command: 'systemctl restart application',
        validationCriteria: 'All services are healthy',
        estimatedTime: 10
      },
      {
        order: 3,
        description: 'Verify functionality',
        validationCriteria: 'Critical functionality tests pass',
        estimatedTime: 15
      }
    ];

    return {
      strategy: 'VERSION_ROLLBACK',
      steps,
      estimatedTime: 30,
      riskAssessment: 'Low risk - reverting to known good state',
      prerequisites: ['Access to previous version', 'Backup of current state']
    };
  }

  private determineUrgency(
    vulnerabilities: VulnerabilityMatch[],
    riskAssessment: RiskAssessment | undefined,
    securityImpact: SecurityImpact
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const hasCriticalVulns = vulnerabilities.some(v => v.vulnerability.severity === 'CRITICAL');
    const hasHighVulns = vulnerabilities.some(v => v.vulnerability.severity === 'HIGH');
    
    if (hasCriticalVulns && securityImpact.vulnerabilitiesFixed.length > 0) {
      return 'CRITICAL';
    }
    
    if (hasHighVulns && securityImpact.vulnerabilitiesFixed.length > 0) {
      return 'HIGH';
    }
    
    if (riskAssessment && (riskAssessment.riskLevel === 'HIGH' || riskAssessment.riskLevel === 'CRITICAL')) {
      return 'HIGH';
    }
    
    if (securityImpact.vulnerabilitiesFixed.length > 0) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  private calculateConfidence(
    candidate: VersionInfo,
    compatibilityRisk: CompatibilityRisk,
    securityImpact: SecurityImpact
  ): number {
    let confidence = 70; // Base confidence
    
    // Increase confidence for security fixes
    confidence += securityImpact.vulnerabilitiesFixed.length * 10;
    
    // Decrease confidence for breaking changes
    confidence -= compatibilityRisk.breakingChanges.length * 15;
    
    // Adjust for release maturity
    const daysSinceRelease = (Date.now() - candidate.releaseDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceRelease >= 30) confidence += 10;
    else if (daysSinceRelease < 7) confidence -= 20;
    
    // Penalize new vulnerabilities
    confidence -= securityImpact.newVulnerabilities.length * 25;
    
    return Math.max(0, Math.min(100, confidence));
  }

  private estimateTimeline(
    urgency: string,
    effortEstimate: EffortEstimate,
    businessContext?: BusinessContext
  ): string {
    if (urgency === 'CRITICAL') {
      return 'Immediate (within 24 hours)';
    } else if (urgency === 'HIGH') {
      return effortEstimate.totalHours <= 8 ? '1-2 days' : '3-5 days';
    } else if (urgency === 'MEDIUM') {
      return effortEstimate.totalHours <= 16 ? '1 week' : '2 weeks';
    } else {
      return 'Next maintenance window';
    }
  }

  private generateReason(
    vulnerabilities: VulnerabilityMatch[],
    candidate: VersionInfo,
    securityImpact: SecurityImpact
  ): string {
    const reasons: string[] = [];
    
    if (securityImpact.vulnerabilitiesFixed.length > 0) {
      reasons.push(`Fixes ${securityImpact.vulnerabilitiesFixed.length} security vulnerabilities`);
    }
    
    if (candidate.securityFixes.length > 0) {
      reasons.push('Contains security enhancements');
    }
    
    if (candidate.fixes.length > 0) {
      reasons.push(`Includes ${candidate.fixes.length} bug fixes`);
    }
    
    if (candidate.isLatest) {
      reasons.push('Latest stable version');
    }
    
    return reasons.join(', ') || 'Routine update';
  }

  private generateDescription(
    dependency: Dependency,
    candidate: VersionInfo,
    securityImpact: SecurityImpact,
    compatibilityRisk: CompatibilityRisk
  ): string {
    const updateType = this.determineUpdateType(dependency.version, candidate.version);
    
    let description = `${updateType.toLowerCase()} update for ${dependency.name} from ${dependency.version} to ${candidate.version}.`;
    
    if (securityImpact.vulnerabilitiesFixed.length > 0) {
      description += ` This update fixes ${securityImpact.vulnerabilitiesFixed.length} known security vulnerabilities.`;
    }
    
    if (compatibilityRisk.breakingChanges.length > 0) {
      description += ` Note: This update includes ${compatibilityRisk.breakingChanges.length} breaking changes that may require code modifications.`;
    }
    
    return description;
  }

  private requiresApproval(
    candidate: VersionInfo,
    compatibilityRisk: CompatibilityRisk,
    strategy: UpdateStrategy
  ): boolean {
    // Check auto-approval rules
    for (const rule of strategy.autoApprovalRules) {
      if (this.matchesAutoApprovalRule(candidate, compatibilityRisk, rule)) {
        return false;
      }
    }
    
    // Require approval for high-risk updates
    if (compatibilityRisk.riskLevel === 'HIGH' || compatibilityRisk.riskLevel === 'CRITICAL') {
      return true;
    }
    
    // Require approval for major updates
    const updateType = this.determineUpdateType('1.0.0', candidate.version); // Mock comparison
    if (updateType === 'MAJOR') {
      return true;
    }
    
    return false;
  }

  private matchesAutoApprovalRule(
    candidate: VersionInfo,
    compatibilityRisk: CompatibilityRisk,
    rule: AutoApprovalRule
  ): boolean {
    switch (rule.condition) {
      case 'PATCH_SECURITY':
        // Would check if it's a patch version with security fixes
        return candidate.securityFixes.length > 0;
      case 'MINOR_NO_BREAKING':
        // Would check if it's a minor version with no breaking changes
        return compatibilityRisk.breakingChanges.length === 0;
      case 'DEV_DEPENDENCIES':
        // Would check if it's a development dependency
        return false; // Simplified
      case 'LOW_RISK':
        return compatibilityRisk.riskLevel === 'LOW';
      default:
        return false;
    }
  }

  private determineUpdateType(currentVersion: string, newVersion: string): 'PATCH' | 'MINOR' | 'MAJOR' | 'REPLACE' {
    try {
      const current = currentVersion.replace(/[^\d.]/g, '').split('.').map(Number);
      const target = newVersion.replace(/[^\d.]/g, '').split('.').map(Number);
      
      const [currentMajor = 0, currentMinor = 0, currentPatch = 0] = current;
      const [targetMajor = 0, targetMinor = 0, targetPatch = 0] = target;
      
      if (targetMajor > currentMajor) return 'MAJOR';
      if (targetMinor > currentMinor) return 'MINOR';
      if (targetPatch > currentPatch) return 'PATCH';
      
      return 'PATCH'; // Default fallback
    } catch {
      return 'REPLACE';
    }
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.replace(/[^\d.]/g, '').split('.').map(Number);
    const v2Parts = version2.replace(/[^\d.]/g, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part !== v2Part) {
        return v1Part - v2Part;
      }
    }
    
    return 0;
  }

  private getDefaultStrategy(tenantId: string): UpdateStrategy {
    return {
      tenantId,
      strategy: 'BALANCED',
      autoApprovalRules: [
        {
          condition: 'PATCH_SECURITY',
          maxRiskScore: 50,
          requiresTests: true,
          environments: ['development', 'staging']
        }
      ],
      testingRequirements: {
        mandatory: ['unit'],
        optional: ['integration'],
        customRules: []
      },
      rolloutConfig: {
        strategy: 'STAGED',
        stages: [
          {
            name: 'development',
            percentage: 100,
            duration: 1,
            successCriteria: ['tests pass'],
            failureCriteria: ['tests fail']
          }
        ],
        rollbackTriggers: ['critical error'],
        monitoringPeriod: 24
      },
      notificationConfig: {
        channels: ['email'],
        events: ['approval_required', 'update_completed'],
        stakeholders: ['development_team']
      }
    };
  }

  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  async createUpdateBatch(
    recommendationIds: string[],
    tenantId: string,
    name: string,
    description: string,
    createdBy: string
  ): Promise<UpdateBatch> {
    const recommendations = recommendationIds.map(id => this.recommendations.get(id)).filter(Boolean);
    
    if (recommendations.length === 0) {
      throw new Error('No valid recommendations found');
    }

    const batchType = this.determineBatchType(recommendations);
    const estimatedDuration = recommendations.reduce((sum, rec) => sum + rec!.effortEstimate.totalHours, 0);
    
    const batch: UpdateBatch = {
      id: this.generateBatchId(),
      tenantId,
      name,
      description,
      recommendations: recommendationIds,
      batchType,
      estimatedDuration,
      approvalStatus: 'PENDING',
      dependencies: this.analyzeBatchDependencies(recommendations),
      prerequisites: this.generateBatchPrerequisites(recommendations),
      rollbackPlan: this.createBatchRollbackPlan(recommendations),
      createdAt: new Date(),
      createdBy
    };

    this.batches.set(batch.id, batch);
    
    this.emit('batchCreated', { batchId: batch.id, recommendationCount: recommendationIds.length });
    
    return batch;
  }

  private determineBatchType(recommendations: (UpdateRecommendation | undefined)[]): 'SECURITY' | 'MAINTENANCE' | 'FEATURE' | 'MIXED' {
    const validRecs = recommendations.filter(Boolean) as UpdateRecommendation[];
    const hasSecurityUpdates = validRecs.some(rec => rec.urgency === 'CRITICAL' || rec.urgency === 'HIGH');
    const hasMaintenanceUpdates = validRecs.some(rec => rec.urgency === 'LOW');
    
    if (hasSecurityUpdates && hasMaintenanceUpdates) return 'MIXED';
    if (hasSecurityUpdates) return 'SECURITY';
    return 'MAINTENANCE';
  }

  private analyzeBatchDependencies(recommendations: (UpdateRecommendation | undefined)[]): BatchDependency[] {
    // Simplified implementation - would analyze actual dependency relationships
    return [];
  }

  private generateBatchPrerequisites(recommendations: (UpdateRecommendation | undefined)[]): string[] {
    const prerequisites = new Set<string>();
    
    recommendations.forEach(rec => {
      if (rec) {
        rec.rollbackPlan.prerequisites.forEach(prereq => prerequisites.add(prereq));
        if (rec.approvalRequired) prerequisites.add('Management approval');
      }
    });
    
    return Array.from(prerequisites);
  }

  private createBatchRollbackPlan(recommendations: (UpdateRecommendation | undefined)[]): RollbackPlan {
    const totalTime = recommendations.reduce((sum, rec) => sum + (rec?.rollbackPlan.estimatedTime || 0), 0);
    
    return {
      strategy: 'VERSION_ROLLBACK',
      steps: [
        {
          order: 1,
          description: 'Stop application services',
          validationCriteria: 'All services stopped',
          estimatedTime: 5
        },
        {
          order: 2,
          description: 'Rollback all dependency versions',
          validationCriteria: 'All versions match baseline',
          estimatedTime: totalTime
        },
        {
          order: 3,
          description: 'Restart services and verify',
          validationCriteria: 'System fully operational',
          estimatedTime: 10
        }
      ],
      estimatedTime: totalTime + 15,
      riskAssessment: 'Medium risk - multiple dependency changes',
      prerequisites: ['System backup', 'Maintenance window']
    };
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getRecommendation(id: string): UpdateRecommendation | undefined {
    return this.recommendations.get(id);
  }

  getRecommendationsByTenant(tenantId: string): UpdateRecommendation[] {
    return Array.from(this.recommendations.values())
      .filter(rec => rec.tenantId === tenantId);
  }

  getBatch(id: string): UpdateBatch | undefined {
    return this.batches.get(id);
  }

  approveRecommendation(id: string, approver: string): boolean {
    const recommendation = this.recommendations.get(id);
    if (!recommendation || recommendation.status !== 'PENDING') return false;
    
    recommendation.status = 'APPROVED';
    this.recommendations.set(id, recommendation);
    
    this.emit('recommendationApproved', { recommendationId: id, approver });
    return true;
  }

  rejectRecommendation(id: string, reason: string, rejector: string): boolean {
    const recommendation = this.recommendations.get(id);
    if (!recommendation || recommendation.status !== 'PENDING') return false;
    
    recommendation.status = 'REJECTED';
    this.recommendations.set(id, recommendation);
    
    this.emit('recommendationRejected', { recommendationId: id, reason, rejector });
    return true;
  }

  setUpdateStrategy(tenantId: string, strategy: UpdateStrategy): void {
    this.strategies.set(tenantId, strategy);
    this.emit('strategyUpdated', { tenantId });
  }

  getUpdateStrategy(tenantId: string): UpdateStrategy | undefined {
    return this.strategies.get(tenantId);
  }

  getRecommendationMetrics(tenantId?: string): any {
    const recommendations = tenantId 
      ? this.getRecommendationsByTenant(tenantId)
      : Array.from(this.recommendations.values());
    
    const total = recommendations.length;
    const byUrgency = recommendations.reduce((acc, rec) => {
      acc[rec.urgency] = (acc[rec.urgency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byStatus = recommendations.reduce((acc, rec) => {
      acc[rec.status] = (acc[rec.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const avgConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / Math.max(1, total);
    const totalEffort = recommendations.reduce((sum, rec) => sum + rec.effortEstimate.totalHours, 0);
    
    return {
      total,
      byUrgency,
      byStatus,
      avgConfidence: Math.round(avgConfidence),
      totalEffort,
      securityUpdates: recommendations.filter(r => r.securityImpact.vulnerabilitiesFixed.length > 0).length
    };
  }
}

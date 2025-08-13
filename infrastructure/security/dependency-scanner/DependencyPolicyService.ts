import { EventEmitter } from 'events';
import { Dependency } from './DependencyInventoryService';
import { Vulnerability, VulnerabilityMatch } from './VulnerabilityDatabaseService';
import { RiskAssessment } from './RiskAssessmentService';

export interface DependencyPolicy {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  priority: number;
  scope: PolicyScope;
  rules: PolicyRule[];
  enforcement: EnforcementConfig;
  exceptions: PolicyException[];
  metadata: PolicyMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface PolicyScope {
  environments: string[];
  projects: string[];
  ecosystems: string[];
  dependencyTypes: ('direct' | 'transitive')[];
  scopes: ('production' | 'development' | 'optional' | 'peer')[];
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  type: 'VULNERABILITY' | 'LICENSE' | 'AGE' | 'MAINTENANCE' | 'CONFIGURATION' | 'CUSTOM';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  metadata: RuleMetadata;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'matches' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'BLOCK' | 'WARN' | 'LOG' | 'NOTIFY' | 'AUTO_FIX' | 'CREATE_ISSUE' | 'ESCALATE';
  config: ActionConfig;
  enabled: boolean;
}

export interface ActionConfig {
  blockingMessage?: string;
  warningMessage?: string;
  logLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  notificationChannels?: string[];
  recipients?: string[];
  escalationLevel?: number;
  autoFixStrategy?: 'UPDATE' | 'REPLACE' | 'CONFIGURE' | 'REMOVE';
  issueTracker?: {
    system: 'JIRA' | 'GITHUB' | 'GITLAB' | 'AZURE_DEVOPS';
    project: string;
    issueType: string;
    priority: string;
    assignee?: string;
    labels?: string[];
  };
  customWebhook?: {
    url: string;
    method: 'POST' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
    payload?: Record<string, any>;
  };
}

export interface RuleMetadata {
  tags: string[];
  category: string;
  rationale: string;
  references: string[];
  lastUpdated: Date;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PolicyMetadata {
  framework?: string;
  regulation?: string;
  tags: string[];
  owner: string;
  reviewers: string[];
  lastReview: Date;
  nextReview: Date;
  changeLog: PolicyChange[];
}

export interface PolicyChange {
  version: string;
  date: Date;
  author: string;
  description: string;
  changes: string[];
}

export interface PolicyException {
  id: string;
  ruleId: string;
  dependency: string;
  reason: string;
  justification: string;
  approvedBy: string;
  approvedAt: Date;
  expiresAt: Date;
  conditions: string[];
  reviewSchedule: {
    frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    nextReview: Date;
    reviewer: string;
  };
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface PolicyViolation {
  id: string;
  tenantId: string;
  policyId: string;
  ruleId: string;
  dependency: Dependency;
  violationType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  message: string;
  details: ViolationDetails;
  context: ViolationContext;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'SUPPRESSED' | 'FALSE_POSITIVE';
  firstDetected: Date;
  lastSeen: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  assignedTo?: string;
  dueDate?: Date;
  tags: string[];
}

export interface ViolationDetails {
  rule: PolicyRule;
  triggeredConditions: RuleCondition[];
  actualValues: Record<string, any>;
  evidence: ViolationEvidence[];
  impact: string;
  recommendation: string;
}

export interface ViolationEvidence {
  type: 'SCAN_RESULT' | 'CONFIGURATION' | 'METADATA' | 'VULNERABILITY' | 'LICENSE';
  source: string;
  content: any;
  timestamp: Date;
}

export interface ViolationContext {
  project: string;
  environment: string;
  ecosystem: string;
  packageFile: string;
  scanId?: string;
  buildId?: string;
  commitId?: string;
  pullRequestId?: string;
}

export interface PolicyEvaluation {
  dependencyId: string;
  policyId: string;
  status: 'COMPLIANT' | 'VIOLATION' | 'WARNING' | 'EXCEPTION' | 'SKIPPED';
  violations: PolicyViolation[];
  warnings: PolicyViolation[];
  exceptions: PolicyException[];
  evaluatedAt: Date;
  evaluationDuration: number;
  metadata: {
    rulesEvaluated: number;
    rulesTriggered: number;
    actionsExecuted: number;
  };
}

export interface PolicyEnforcementResult {
  evaluationId: string;
  tenantId: string;
  totalDependencies: number;
  evaluatedDependencies: number;
  skippedDependencies: number;
  compliantDependencies: number;
  violatingDependencies: number;
  warningDependencies: number;
  evaluations: PolicyEvaluation[];
  executedActions: ExecutedAction[];
  summary: EnforcementSummary;
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface ExecutedAction {
  violationId: string;
  actionType: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  result?: any;
  error?: string;
  executedAt: Date;
  executionDuration: number;
}

export interface EnforcementSummary {
  policiesEvaluated: number;
  rulesEvaluated: number;
  violationsDetected: number;
  actionsExecuted: number;
  blockedDependencies: number;
  severityBreakdown: Record<string, number>;
  policyBreakdown: Record<string, number>;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'SECURITY' | 'LICENSE' | 'MAINTENANCE' | 'COMPLIANCE' | 'CUSTOM';
  framework?: string;
  rules: Omit<PolicyRule, 'id'>[];
  defaultScope: PolicyScope;
  metadata: {
    version: string;
    author: string;
    tags: string[];
    references: string[];
  };
}

export class DependencyPolicyService extends EventEmitter {
  private policies: Map<string, DependencyPolicy> = new Map();
  private violations: Map<string, PolicyViolation> = new Map();
  private evaluationHistory: Map<string, PolicyEnforcementResult> = new Map();
  private templates: Map<string, PolicyTemplate> = new Map();

  constructor() {
    super();
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // Security Policy Template
    this.templates.set('security-standard', {
      id: 'security-standard',
      name: 'Standard Security Policy',
      description: 'Comprehensive security policy for dependency management',
      category: 'SECURITY',
      rules: [
        {
          name: 'Block Critical Vulnerabilities',
          description: 'Block dependencies with critical security vulnerabilities',
          type: 'VULNERABILITY',
          severity: 'CRITICAL',
          enabled: true,
          conditions: [
            {
              field: 'vulnerability.severity',
              operator: 'equals',
              value: 'CRITICAL'
            }
          ],
          actions: [
            {
              type: 'BLOCK',
              config: {
                blockingMessage: 'Dependency contains critical security vulnerabilities and cannot be used'
              },
              enabled: true
            },
            {
              type: 'NOTIFY',
              config: {
                notificationChannels: ['security-alerts'],
                recipients: ['security-team@company.com']
              },
              enabled: true
            }
          ],
          metadata: {
            tags: ['security', 'vulnerability', 'critical'],
            category: 'security',
            rationale: 'Critical vulnerabilities pose immediate security risks',
            references: ['NIST SP 800-53', 'OWASP Top 10'],
            lastUpdated: new Date(),
            impact: 'CRITICAL'
          }
        },
        {
          name: 'Warn on High Vulnerabilities',
          description: 'Warn when dependencies have high severity vulnerabilities',
          type: 'VULNERABILITY',
          severity: 'HIGH',
          enabled: true,
          conditions: [
            {
              field: 'vulnerability.severity',
              operator: 'equals',
              value: 'HIGH'
            }
          ],
          actions: [
            {
              type: 'WARN',
              config: {
                warningMessage: 'Dependency contains high severity vulnerabilities - review and update recommended'
              },
              enabled: true
            },
            {
              type: 'CREATE_ISSUE',
              config: {
                issueTracker: {
                  system: 'JIRA',
                  project: 'SEC',
                  issueType: 'Security Issue',
                  priority: 'High',
                  labels: ['security', 'vulnerability']
                }
              },
              enabled: true
            }
          ],
          metadata: {
            tags: ['security', 'vulnerability', 'high'],
            category: 'security',
            rationale: 'High vulnerabilities should be tracked and addressed',
            references: ['CVE Database'],
            lastUpdated: new Date(),
            impact: 'HIGH'
          }
        }
      ],
      defaultScope: {
        environments: ['production', 'staging'],
        projects: [],
        ecosystems: ['npm', 'python', 'java'],
        dependencyTypes: ['direct', 'transitive'],
        scopes: ['production']
      },
      metadata: {
        version: '1.0.0',
        author: 'Security Team',
        tags: ['security', 'vulnerability', 'standard'],
        references: ['NIST SP 800-53', 'OWASP']
      }
    });

    // License Compliance Template
    this.templates.set('license-compliance', {
      id: 'license-compliance',
      name: 'License Compliance Policy',
      description: 'Ensure compliance with open source license requirements',
      category: 'LICENSE',
      rules: [
        {
          name: 'Block Copyleft Licenses',
          description: 'Block dependencies with restrictive copyleft licenses',
          type: 'LICENSE',
          severity: 'HIGH',
          enabled: true,
          conditions: [
            {
              field: 'license',
              operator: 'in',
              value: ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0']
            }
          ],
          actions: [
            {
              type: 'BLOCK',
              config: {
                blockingMessage: 'License is not approved for commercial use'
              },
              enabled: true
            }
          ],
          metadata: {
            tags: ['license', 'compliance', 'copyleft'],
            category: 'license',
            rationale: 'Copyleft licenses may impose restrictions on commercial products',
            references: ['Corporate License Policy'],
            lastUpdated: new Date(),
            impact: 'HIGH'
          }
        },
        {
          name: 'Require License Information',
          description: 'Require all dependencies to have license information',
          type: 'LICENSE',
          severity: 'MEDIUM',
          enabled: true,
          conditions: [
            {
              field: 'licenses',
              operator: 'not_exists',
              value: null
            }
          ],
          actions: [
            {
              type: 'WARN',
              config: {
                warningMessage: 'Dependency lacks license information - manual review required'
              },
              enabled: true
            }
          ],
          metadata: {
            tags: ['license', 'compliance'],
            category: 'license',
            rationale: 'All dependencies must have clear license information',
            references: ['Legal Requirements'],
            lastUpdated: new Date(),
            impact: 'MEDIUM'
          }
        }
      ],
      defaultScope: {
        environments: ['production'],
        projects: [],
        ecosystems: ['npm', 'python', 'java'],
        dependencyTypes: ['direct', 'transitive'],
        scopes: ['production']
      },
      metadata: {
        version: '1.0.0',
        author: 'Legal Team',
        tags: ['license', 'compliance', 'legal'],
        references: ['Corporate Legal Policy']
      }
    });

    // Maintenance Policy Template
    this.templates.set('maintenance-policy', {
      id: 'maintenance-policy',
      name: 'Dependency Maintenance Policy',
      description: 'Ensure dependencies are actively maintained and up-to-date',
      category: 'MAINTENANCE',
      rules: [
        {
          name: 'Block Unmaintained Dependencies',
          description: 'Block dependencies that have not been updated in over 2 years',
          type: 'MAINTENANCE',
          severity: 'MEDIUM',
          enabled: true,
          conditions: [
            {
              field: 'daysSinceLastUpdate',
              operator: 'greater_than',
              value: 730
            }
          ],
          actions: [
            {
              type: 'WARN',
              config: {
                warningMessage: 'Dependency appears to be unmaintained - consider alternatives'
              },
              enabled: true
            }
          ],
          metadata: {
            tags: ['maintenance', 'age', 'support'],
            category: 'maintenance',
            rationale: 'Unmaintained dependencies pose security and stability risks',
            references: ['Software Maintenance Best Practices'],
            lastUpdated: new Date(),
            impact: 'MEDIUM'
          }
        }
      ],
      defaultScope: {
        environments: ['production'],
        projects: [],
        ecosystems: ['npm', 'python', 'java'],
        dependencyTypes: ['direct'],
        scopes: ['production']
      },
      metadata: {
        version: '1.0.0',
        author: 'Engineering Team',
        tags: ['maintenance', 'quality'],
        references: []
      }
    });
  }

  async createPolicy(
    tenantId: string,
    policyData: Omit<DependencyPolicy, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<DependencyPolicy> {
    const policy: DependencyPolicy = {
      ...policyData,
      id: this.generatePolicyId(),
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy
    };

    // Validate policy structure
    this.validatePolicy(policy);

    this.policies.set(policy.id, policy);

    this.emit('policyCreated', {
      policyId: policy.id,
      tenantId,
      name: policy.name
    });

    return policy;
  }

  async createPolicyFromTemplate(
    tenantId: string,
    templateId: string,
    customizations: {
      name?: string;
      scope?: Partial<PolicyScope>;
      ruleOverrides?: Record<string, Partial<PolicyRule>>;
    },
    createdBy: string
  ): Promise<DependencyPolicy> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const rules: PolicyRule[] = template.rules.map((rule, index) => {
      const ruleId = this.generateRuleId();
      const override = customizations.ruleOverrides?.[rule.name] || {};
      
      return {
        id: ruleId,
        ...rule,
        ...override
      };
    });

    const policy: DependencyPolicy = {
      id: this.generatePolicyId(),
      tenantId,
      name: customizations.name || template.name,
      description: template.description,
      version: '1.0.0',
      enabled: true,
      priority: 100,
      scope: {
        ...template.defaultScope,
        ...customizations.scope
      },
      rules,
      enforcement: {
        mode: 'ENFORCING',
        continueOnError: false,
        parallel: true,
        timeout: 300,
        retryAttempts: 2
      },
      exceptions: [],
      metadata: {
        framework: template.framework,
        tags: template.metadata.tags,
        owner: createdBy,
        reviewers: [],
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        changeLog: [{
          version: '1.0.0',
          date: new Date(),
          author: createdBy,
          description: `Created from template: ${template.name}`,
          changes: ['Initial policy creation']
        }]
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy
    };

    this.policies.set(policy.id, policy);

    this.emit('policyCreatedFromTemplate', {
      policyId: policy.id,
      templateId,
      tenantId
    });

    return policy;
  }

  private validatePolicy(policy: DependencyPolicy): void {
    if (!policy.name || policy.name.trim().length === 0) {
      throw new Error('Policy name is required');
    }

    if (!policy.rules || policy.rules.length === 0) {
      throw new Error('Policy must have at least one rule');
    }

    for (const rule of policy.rules) {
      this.validateRule(rule);
    }
  }

  private validateRule(rule: PolicyRule): void {
    if (!rule.name || rule.name.trim().length === 0) {
      throw new Error('Rule name is required');
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      throw new Error('Rule must have at least one condition');
    }

    if (!rule.actions || rule.actions.length === 0) {
      throw new Error('Rule must have at least one action');
    }

    for (const condition of rule.conditions) {
      this.validateCondition(condition);
    }

    for (const action of rule.actions) {
      this.validateAction(action);
    }
  }

  private validateCondition(condition: RuleCondition): void {
    if (!condition.field) {
      throw new Error('Condition field is required');
    }

    if (!condition.operator) {
      throw new Error('Condition operator is required');
    }

    const validOperators = [
      'equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 
      'ends_with', 'matches', 'greater_than', 'less_than', 'greater_equal', 
      'less_equal', 'in', 'not_in', 'exists', 'not_exists'
    ];

    if (!validOperators.includes(condition.operator)) {
      throw new Error(`Invalid condition operator: ${condition.operator}`);
    }
  }

  private validateAction(action: RuleAction): void {
    const validActionTypes = ['BLOCK', 'WARN', 'LOG', 'NOTIFY', 'AUTO_FIX', 'CREATE_ISSUE', 'ESCALATE'];
    
    if (!validActionTypes.includes(action.type)) {
      throw new Error(`Invalid action type: ${action.type}`);
    }
  }

  async evaluatePolicies(
    dependencies: Dependency[],
    tenantId: string,
    context: {
      project?: string;
      environment?: string;
      scanId?: string;
      buildId?: string;
      commitId?: string;
    } = {}
  ): Promise<PolicyEnforcementResult> {
    const evaluationId = this.generateEvaluationId();
    const startTime = new Date();

    try {
      this.emit('policyEvaluationStarted', {
        evaluationId,
        tenantId,
        dependencyCount: dependencies.length
      });

      const policies = this.getPoliciesByTenant(tenantId).filter(p => p.enabled);
      const evaluations: PolicyEvaluation[] = [];
      const executedActions: ExecutedAction[] = [];
      
      let compliantCount = 0;
      let violatingCount = 0;
      let warningCount = 0;
      let skippedCount = 0;

      for (const dependency of dependencies) {
        try {
          const evaluation = await this.evaluateDependency(dependency, policies, context);
          evaluations.push(evaluation);

          // Execute actions for violations
          for (const violation of evaluation.violations) {
            const actions = await this.executeViolationActions(violation, context);
            executedActions.push(...actions);
          }

          // Count results
          if (evaluation.status === 'COMPLIANT') compliantCount++;
          else if (evaluation.status === 'VIOLATION') violatingCount++;
          else if (evaluation.status === 'WARNING') warningCount++;
          else if (evaluation.status === 'SKIPPED') skippedCount++;

        } catch (error) {
          skippedCount++;
          this.emit('dependencyEvaluationError', {
            evaluationId,
            dependency: dependency.name,
            error: error.message
          });
        }
      }

      const endTime = new Date();
      const result: PolicyEnforcementResult = {
        evaluationId,
        tenantId,
        totalDependencies: dependencies.length,
        evaluatedDependencies: dependencies.length - skippedCount,
        skippedDependencies: skippedCount,
        compliantDependencies: compliantCount,
        violatingDependencies: violatingCount,
        warningDependencies: warningCount,
        evaluations,
        executedActions,
        summary: {
          policiesEvaluated: policies.length,
          rulesEvaluated: policies.reduce((sum, p) => sum + p.rules.length, 0),
          violationsDetected: evaluations.reduce((sum, e) => sum + e.violations.length, 0),
          actionsExecuted: executedActions.length,
          blockedDependencies: evaluations.filter(e => 
            e.violations.some(v => v.details.rule.actions.some(a => a.type === 'BLOCK'))
          ).length,
          severityBreakdown: this.calculateSeverityBreakdown(evaluations),
          policyBreakdown: this.calculatePolicyBreakdown(evaluations)
        },
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime()
      };

      this.evaluationHistory.set(evaluationId, result);

      this.emit('policyEvaluationCompleted', {
        evaluationId,
        tenantId,
        violationsCount: result.summary.violationsDetected,
        blockedCount: result.summary.blockedDependencies
      });

      return result;

    } catch (error) {
      this.emit('policyEvaluationFailed', {
        evaluationId,
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  private async evaluateDependency(
    dependency: Dependency,
    policies: DependencyPolicy[],
    context: any
  ): Promise<PolicyEvaluation> {
    const startTime = Date.now();
    const violations: PolicyViolation[] = [];
    const warnings: PolicyViolation[] = [];
    const exceptions: PolicyException[] = [];
    let rulesEvaluated = 0;
    let rulesTriggered = 0;

    for (const policy of policies) {
      // Check if dependency is in policy scope
      if (!this.isDependencyInScope(dependency, policy.scope, context)) {
        continue;
      }

      for (const rule of policy.rules) {
        if (!rule.enabled) continue;

        rulesEvaluated++;

        // Check for exceptions
        const exception = this.findActiveException(policy, rule, dependency);
        if (exception) {
          exceptions.push(exception);
          continue;
        }

        // Evaluate rule conditions
        const conditionResult = await this.evaluateRuleConditions(rule, dependency, context);
        
        if (conditionResult.triggered) {
          rulesTriggered++;
          
          const violation = this.createViolation(
            policy,
            rule,
            dependency,
            conditionResult,
            context
          );

          // Categorize violation based on actions
          const hasBlockingAction = rule.actions.some(a => a.type === 'BLOCK' && a.enabled);
          if (hasBlockingAction) {
            violations.push(violation);
          } else {
            warnings.push(violation);
          }

          this.violations.set(violation.id, violation);
        }
      }
    }

    const status = this.determineEvaluationStatus(violations, warnings, exceptions);
    const duration = Date.now() - startTime;

    return {
      dependencyId: `${dependency.name}@${dependency.version}`,
      policyId: policies.map(p => p.id).join(','),
      status,
      violations,
      warnings,
      exceptions,
      evaluatedAt: new Date(),
      evaluationDuration: duration,
      metadata: {
        rulesEvaluated,
        rulesTriggered,
        actionsExecuted: 0 // Will be updated after action execution
      }
    };
  }

  private isDependencyInScope(
    dependency: Dependency,
    scope: PolicyScope,
    context: any
  ): boolean {
    // Check ecosystem
    if (scope.ecosystems.length > 0 && !scope.ecosystems.includes(dependency.ecosystem)) {
      return false;
    }

    // Check dependency type
    if (scope.dependencyTypes.length > 0 && !scope.dependencyTypes.includes(dependency.type)) {
      return false;
    }

    // Check scope
    if (scope.scopes.length > 0 && !scope.scopes.includes(dependency.scope)) {
      return false;
    }

    // Check environment
    if (scope.environments.length > 0 && context.environment && 
        !scope.environments.includes(context.environment)) {
      return false;
    }

    // Check project
    if (scope.projects.length > 0 && context.project && 
        !scope.projects.includes(context.project)) {
      return false;
    }

    return true;
  }

  private findActiveException(
    policy: DependencyPolicy,
    rule: PolicyRule,
    dependency: Dependency
  ): PolicyException | undefined {
    return policy.exceptions.find(exception => 
      exception.ruleId === rule.id &&
      exception.dependency === dependency.name &&
      exception.status === 'ACTIVE' &&
      exception.expiresAt > new Date()
    );
  }

  private async evaluateRuleConditions(
    rule: PolicyRule,
    dependency: Dependency,
    context: any
  ): Promise<{ triggered: boolean; triggeredConditions: RuleCondition[]; actualValues: Record<string, any> }> {
    const triggeredConditions: RuleCondition[] = [];
    const actualValues: Record<string, any> = {};
    
    // Get additional data based on rule type
    const dependencyData = await this.enrichDependencyData(dependency, rule.type, context);
    
    let currentResult = true;
    let currentOperator: 'AND' | 'OR' = 'AND';

    for (let i = 0; i < rule.conditions.length; i++) {
      const condition = rule.conditions[i];
      const conditionResult = this.evaluateCondition(condition, dependencyData);
      
      actualValues[condition.field] = this.getFieldValue(condition.field, dependencyData);

      if (conditionResult) {
        triggeredConditions.push(condition);
      }

      // Apply logical operator
      if (i === 0) {
        currentResult = conditionResult;
      } else {
        if (currentOperator === 'AND') {
          currentResult = currentResult && conditionResult;
        } else {
          currentResult = currentResult || conditionResult;
        }
      }

      // Update operator for next iteration
      if (condition.logicalOperator) {
        currentOperator = condition.logicalOperator;
      }
    }

    return {
      triggered: currentResult,
      triggeredConditions,
      actualValues
    };
  }

  private async enrichDependencyData(dependency: Dependency, ruleType: string, context: any): Promise<any> {
    const data: any = { ...dependency };

    // Add calculated fields
    if (dependency.lastUpdate) {
      data.daysSinceLastUpdate = Math.floor(
        (Date.now() - dependency.lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Add context data
    data.context = context;

    // Add vulnerability data if needed
    if (ruleType === 'VULNERABILITY') {
      // Mock vulnerability data - would be fetched from vulnerability service
      data.vulnerabilities = [
        {
          severity: 'HIGH',
          cve: 'CVE-2023-1234',
          cvssScore: 7.5
        }
      ];
    }

    // Add risk assessment data if needed
    data.riskScore = Math.floor(Math.random() * 100);

    return data;
  }

  private evaluateCondition(condition: RuleCondition, data: any): boolean {
    const fieldValue = this.getFieldValue(condition.field, data);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(conditionValue);
      case 'not_contains':
        return typeof fieldValue === 'string' && !fieldValue.includes(conditionValue);
      case 'starts_with':
        return typeof fieldValue === 'string' && fieldValue.startsWith(conditionValue);
      case 'ends_with':
        return typeof fieldValue === 'string' && fieldValue.endsWith(conditionValue);
      case 'matches':
        return typeof fieldValue === 'string' && new RegExp(conditionValue).test(fieldValue);
      case 'greater_than':
        return typeof fieldValue === 'number' && fieldValue > conditionValue;
      case 'less_than':
        return typeof fieldValue === 'number' && fieldValue < conditionValue;
      case 'greater_equal':
        return typeof fieldValue === 'number' && fieldValue >= conditionValue;
      case 'less_equal':
        return typeof fieldValue === 'number' && fieldValue <= conditionValue;
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      default:
        return false;
    }
  }

  private getFieldValue(field: string, data: any): any {
    const parts = field.split('.');
    let value = data;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private createViolation(
    policy: DependencyPolicy,
    rule: PolicyRule,
    dependency: Dependency,
    conditionResult: any,
    context: any
  ): PolicyViolation {
    return {
      id: this.generateViolationId(),
      tenantId: policy.tenantId,
      policyId: policy.id,
      ruleId: rule.id,
      dependency,
      violationType: rule.type,
      severity: rule.severity,
      message: this.generateViolationMessage(rule, dependency, conditionResult),
      details: {
        rule,
        triggeredConditions: conditionResult.triggeredConditions,
        actualValues: conditionResult.actualValues,
        evidence: this.generateEvidence(rule, dependency, conditionResult),
        impact: this.generateImpactDescription(rule, dependency),
        recommendation: this.generateRecommendation(rule, dependency)
      },
      context: {
        project: context.project || 'unknown',
        environment: context.environment || 'unknown',
        ecosystem: dependency.ecosystem,
        packageFile: dependency.packageFile,
        scanId: context.scanId,
        buildId: context.buildId,
        commitId: context.commitId,
        pullRequestId: context.pullRequestId
      },
      status: 'OPEN',
      firstDetected: new Date(),
      lastSeen: new Date(),
      tags: rule.metadata.tags || []
    };
  }

  private generateViolationMessage(rule: PolicyRule, dependency: Dependency, conditionResult: any): string {
    const baseName = `${dependency.name}@${dependency.version}`;
    
    switch (rule.type) {
      case 'VULNERABILITY':
        return `${baseName} contains security vulnerabilities that violate policy: ${rule.name}`;
      case 'LICENSE':
        return `${baseName} has license restrictions that violate policy: ${rule.name}`;
      case 'AGE':
        return `${baseName} is outdated and violates policy: ${rule.name}`;
      case 'MAINTENANCE':
        return `${baseName} appears unmaintained and violates policy: ${rule.name}`;
      default:
        return `${baseName} violates policy rule: ${rule.name}`;
    }
  }

  private generateEvidence(rule: PolicyRule, dependency: Dependency, conditionResult: any): ViolationEvidence[] {
    const evidence: ViolationEvidence[] = [];
    
    for (const condition of conditionResult.triggeredConditions) {
      evidence.push({
        type: 'CONFIGURATION',
        source: 'policy-engine',
        content: {
          field: condition.field,
          operator: condition.operator,
          expectedValue: condition.value,
          actualValue: conditionResult.actualValues[condition.field]
        },
        timestamp: new Date()
      });
    }
    
    return evidence;
  }

  private generateImpactDescription(rule: PolicyRule, dependency: Dependency): string {
    switch (rule.type) {
      case 'VULNERABILITY':
        return `Security vulnerability may expose the application to attacks`;
      case 'LICENSE':
        return `License restrictions may create legal compliance issues`;
      case 'AGE':
        return `Outdated dependency may lack security updates and bug fixes`;
      case 'MAINTENANCE':
        return `Unmaintained dependency may pose long-term security and stability risks`;
      default:
        return `Policy violation may impact application security and compliance`;
    }
  }

  private generateRecommendation(rule: PolicyRule, dependency: Dependency): string {
    switch (rule.type) {
      case 'VULNERABILITY':
        return `Update ${dependency.name} to a version that fixes the vulnerability`;
      case 'LICENSE':
        return `Replace ${dependency.name} with an alternative that has an approved license`;
      case 'AGE':
        return `Update ${dependency.name} to the latest stable version`;
      case 'MAINTENANCE':
        return `Consider replacing ${dependency.name} with a more actively maintained alternative`;
      default:
        return `Review and address the policy violation for ${dependency.name}`;
    }
  }

  private determineEvaluationStatus(
    violations: PolicyViolation[],
    warnings: PolicyViolation[],
    exceptions: PolicyException[]
  ): 'COMPLIANT' | 'VIOLATION' | 'WARNING' | 'EXCEPTION' | 'SKIPPED' {
    if (violations.length > 0) return 'VIOLATION';
    if (warnings.length > 0) return 'WARNING';
    if (exceptions.length > 0) return 'EXCEPTION';
    return 'COMPLIANT';
  }

  private async executeViolationActions(
    violation: PolicyViolation,
    context: any
  ): Promise<ExecutedAction[]> {
    const executedActions: ExecutedAction[] = [];
    const rule = violation.details.rule;

    for (const action of rule.actions) {
      if (!action.enabled) continue;

      const startTime = Date.now();
      try {
        const result = await this.executeAction(action, violation, context);
        
        executedActions.push({
          violationId: violation.id,
          actionType: action.type,
          status: 'SUCCESS',
          result,
          executedAt: new Date(),
          executionDuration: Date.now() - startTime
        });

      } catch (error) {
        executedActions.push({
          violationId: violation.id,
          actionType: action.type,
          status: 'FAILED',
          error: error.message,
          executedAt: new Date(),
          executionDuration: Date.now() - startTime
        });
      }
    }

    return executedActions;
  }

  private async executeAction(action: RuleAction, violation: PolicyViolation, context: any): Promise<any> {
    switch (action.type) {
      case 'BLOCK':
        return this.executeBlockAction(action.config, violation);
      case 'WARN':
        return this.executeWarnAction(action.config, violation);
      case 'LOG':
        return this.executeLogAction(action.config, violation);
      case 'NOTIFY':
        return this.executeNotifyAction(action.config, violation);
      case 'AUTO_FIX':
        return this.executeAutoFixAction(action.config, violation);
      case 'CREATE_ISSUE':
        return this.executeCreateIssueAction(action.config, violation);
      case 'ESCALATE':
        return this.executeEscalateAction(action.config, violation);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeBlockAction(config: ActionConfig, violation: PolicyViolation): Promise<any> {
    this.emit('dependencyBlocked', {
      dependency: violation.dependency.name,
      reason: config.blockingMessage || 'Policy violation',
      policyId: violation.policyId,
      ruleId: violation.ruleId
    });
    
    return { blocked: true, message: config.blockingMessage };
  }

  private async executeWarnAction(config: ActionConfig, violation: PolicyViolation): Promise<any> {
    this.emit('dependencyWarning', {
      dependency: violation.dependency.name,
      warning: config.warningMessage || 'Policy violation detected',
      policyId: violation.policyId,
      ruleId: violation.ruleId
    });
    
    return { warned: true, message: config.warningMessage };
  }

  private async executeLogAction(config: ActionConfig, violation: PolicyViolation): Promise<any> {
    const logLevel = config.logLevel || 'WARN';
    const message = `Policy violation: ${violation.message}`;
    
    console.log(`[${logLevel}] ${message}`);
    
    return { logged: true, level: logLevel, message };
  }

  private async executeNotifyAction(config: ActionConfig, violation: PolicyViolation): Promise<any> {
    const channels = config.notificationChannels || [];
    const recipients = config.recipients || [];
    
    this.emit('policyViolationNotification', {
      violation,
      channels,
      recipients
    });
    
    return { notified: true, channels: channels.length, recipients: recipients.length };
  }

  private async executeAutoFixAction(config: ActionConfig, violation: PolicyViolation): Promise<any> {
    const strategy = config.autoFixStrategy || 'UPDATE';
    
    this.emit('autoFixTriggered', {
      dependency: violation.dependency.name,
      strategy,
      violation: violation.id
    });
    
    return { autoFixTriggered: true, strategy };
  }

  private async executeCreateIssueAction(config: ActionConfig, violation: PolicyViolation): Promise<any> {
    if (!config.issueTracker) {
      throw new Error('Issue tracker configuration is required for CREATE_ISSUE action');
    }
    
    const issueData = {
      title: `Policy Violation: ${violation.dependency.name}`,
      description: violation.message,
      priority: config.issueTracker.priority,
      labels: config.issueTracker.labels || [],
      assignee: config.issueTracker.assignee
    };
    
    this.emit('issueCreated', {
      tracker: config.issueTracker.system,
      project: config.issueTracker.project,
      issue: issueData,
      violation: violation.id
    });
    
    return { issueCreated: true, tracker: config.issueTracker.system };
  }

  private async executeEscalateAction(config: ActionConfig, violation: PolicyViolation): Promise<any> {
    const level = config.escalationLevel || 1;
    
    this.emit('violationEscalated', {
      violation,
      level,
      escalatedAt: new Date()
    });
    
    return { escalated: true, level };
  }

  private calculateSeverityBreakdown(evaluations: PolicyEvaluation[]): Record<string, number> {
    const breakdown: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFO: 0
    };

    for (const evaluation of evaluations) {
      for (const violation of [...evaluation.violations, ...evaluation.warnings]) {
        breakdown[violation.severity]++;
      }
    }

    return breakdown;
  }

  private calculatePolicyBreakdown(evaluations: PolicyEvaluation[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const evaluation of evaluations) {
      const policyIds = evaluation.policyId.split(',');
      for (const policyId of policyIds) {
        breakdown[policyId] = (breakdown[policyId] || 0) + 1;
      }
    }

    return breakdown;
  }

  // ID generators
  private generatePolicyId(): string {
    return `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEvaluationId(): string {
    return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getPolicy(policyId: string): DependencyPolicy | undefined {
    return this.policies.get(policyId);
  }

  getPoliciesByTenant(tenantId: string): DependencyPolicy[] {
    return Array.from(this.policies.values())
      .filter(p => p.tenantId === tenantId)
      .sort((a, b) => b.priority - a.priority);
  }

  getTemplate(templateId: string): PolicyTemplate | undefined {
    return this.templates.get(templateId);
  }

  getTemplates(): PolicyTemplate[] {
    return Array.from(this.templates.values());
  }

  getViolation(violationId: string): PolicyViolation | undefined {
    return this.violations.get(violationId);
  }

  getViolationsByTenant(tenantId: string): PolicyViolation[] {
    return Array.from(this.violations.values())
      .filter(v => v.tenantId === tenantId)
      .sort((a, b) => b.firstDetected.getTime() - a.firstDetected.getTime());
  }

  getEvaluationResult(evaluationId: string): PolicyEnforcementResult | undefined {
    return this.evaluationHistory.get(evaluationId);
  }

  async updatePolicy(
    policyId: string,
    updates: Partial<DependencyPolicy>,
    updatedBy: string
  ): Promise<DependencyPolicy> {
    const existing = this.policies.get(policyId);
    if (!existing) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    const updated: DependencyPolicy = {
      ...existing,
      ...updates,
      id: policyId,
      updatedAt: new Date()
    };

    // Update version if rules changed
    if (updates.rules) {
      const versionParts = updated.version.split('.');
      const major = parseInt(versionParts[0] || '1');
      const minor = parseInt(versionParts[1] || '0');
      const patch = parseInt(versionParts[2] || '0');
      
      updated.version = `${major}.${minor}.${patch + 1}`;
      
      // Add change log entry
      updated.metadata.changeLog.push({
        version: updated.version,
        date: new Date(),
        author: updatedBy,
        description: 'Policy rules updated',
        changes: ['Rules modified']
      });
    }

    this.validatePolicy(updated);
    this.policies.set(policyId, updated);

    this.emit('policyUpdated', { policyId, version: updated.version });
    
    return updated;
  }

  async resolveViolation(
    violationId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<PolicyViolation> {
    const violation = this.violations.get(violationId);
    if (!violation) {
      throw new Error(`Violation not found: ${violationId}`);
    }

    violation.status = 'RESOLVED';
    violation.resolvedAt = new Date();
    violation.resolvedBy = resolvedBy;
    violation.resolution = resolution;

    this.violations.set(violationId, violation);

    this.emit('violationResolved', { violationId, resolvedBy });
    
    return violation;
  }

  getPolicyMetrics(tenantId?: string): any {
    const policies = tenantId 
      ? this.getPoliciesByTenant(tenantId)
      : Array.from(this.policies.values());
    
    const violations = tenantId
      ? this.getViolationsByTenant(tenantId)
      : Array.from(this.violations.values());

    const openViolations = violations.filter(v => v.status === 'OPEN');
    const resolvedViolations = violations.filter(v => v.status === 'RESOLVED');

    return {
      totalPolicies: policies.length,
      enabledPolicies: policies.filter(p => p.enabled).length,
      totalRules: policies.reduce((sum, p) => sum + p.rules.length, 0),
      totalViolations: violations.length,
      openViolations: openViolations.length,
      resolvedViolations: resolvedViolations.length,
      violationsByoSeverity: this.getViolationsBySeverity(violations),
      violationsByType: this.getViolationsByType(violations),
      evaluationHistory: this.evaluationHistory.size
    };
  }

  private getViolationsBySeverity(violations: PolicyViolation[]): Record<string, number> {
    return violations.reduce((acc, violation) => {
      acc[violation.severity] = (acc[violation.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getViolationsByType(violations: PolicyViolation[]): Record<string, number> {
    return violations.reduce((acc, violation) => {
      acc[violation.violationType] = (acc[violation.violationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Enforcement config interface
interface EnforcementConfig {
  mode: 'ENFORCING' | 'PERMISSIVE' | 'DISABLED';
  continueOnError: boolean;
  parallel: boolean;
  timeout: number;
  retryAttempts: number;
}
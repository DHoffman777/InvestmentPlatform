import { EventEmitter } from 'events';
import {
  RegulatoryRule,
  RegulatoryCondition,
  ComplianceValidationRequest,
  ComplianceValidationResult,
  RuleValidationResult,
  ComplianceRecommendation,
  RegulatoryValidatorConfig,
} from '../types';

export class RegulatoryRuleEngine extends EventEmitter {
  private rules: Map<string, RegulatoryRule> = new Map();
  private rulesByCategory: Map<string, RegulatoryRule[]> = new Map();
  private performanceMetrics: Map<string, { executionCount: number; totalTime: number; successCount: number }> = new Map();

  constructor(private config: RegulatoryValidatorConfig) {
    super();
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    const defaultRules: RegulatoryRule[] = [
      // SEC Rules
      {
        id: 'SEC_ADV_CUSTODY',
        name: 'ADV Custody Rule',
        description: 'Investment advisers with custody must comply with custody requirements',
        jurisdiction: 'US',
        category: 'SEC',
        severity: 'HIGH',
        enabled: true,
        conditions: [
          {
            field: 'hasClientAssets',
            operator: 'equals',
            value: true,
          },
          {
            field: 'custodyArrangement',
            operator: 'not_equals',
            value: null,
            logicalOperator: 'AND',
          },
        ],
        remediation: 'Establish proper custody arrangements with qualified custodians',
        references: ['Rule 206(4)-2', '17 CFR 275.206(4)-2'],
        effectiveDate: new Date('2010-09-13'),
        lastUpdated: new Date(),
        version: '1.0',
      },
      {
        id: 'SEC_ACCREDITED_INVESTOR',
        name: 'Accredited Investor Verification',
        description: 'Verify client meets accredited investor requirements for private placements',
        jurisdiction: 'US',
        category: 'SEC',
        severity: 'HIGH',
        enabled: true,
        conditions: [
          {
            field: 'investmentType',
            operator: 'in',
            value: ['private_equity', 'hedge_fund', 'private_placement'],
          },
          {
            field: 'netWorth',
            operator: 'greater_than',
            value: 1000000,
            logicalOperator: 'OR',
          },
          {
            field: 'annualIncome',
            operator: 'greater_than',
            value: 200000,
            logicalOperator: 'OR',
          },
        ],
        remediation: 'Obtain accredited investor verification documentation',
        references: ['Rule 501', '17 CFR 230.501'],
        effectiveDate: new Date('2020-12-08'),
        lastUpdated: new Date(),
        version: '2.0',
      },
      {
        id: 'SEC_FIDUCIARY_DUTY',
        name: 'Investment Adviser Fiduciary Duty',
        description: 'Investment advisers must act in client\'s best interest',
        jurisdiction: 'US',
        category: 'SEC',
        severity: 'CRITICAL',
        enabled: true,
        conditions: [
          {
            field: 'advisorType',
            operator: 'equals',
            value: 'investment_advisor',
          },
          {
            field: 'hasClientRelationship',
            operator: 'equals',
            value: true,
            logicalOperator: 'AND',
          },
        ],
        remediation: 'Ensure all recommendations are in client\'s best interest with proper documentation',
        references: ['Investment Advisers Act of 1940', 'SEC Staff Interpretation'],
        effectiveDate: new Date('1940-08-22'),
        lastUpdated: new Date(),
        version: '1.0',
      },

      // FINRA Rules
      {
        id: 'FINRA_SUITABILITY',
        name: 'Suitability Rule',
        description: 'Ensure investment recommendations are suitable for client',
        jurisdiction: 'US',
        category: 'FINRA',
        severity: 'HIGH',
        enabled: true,
        conditions: [
          {
            field: 'clientRiskTolerance',
            operator: 'not_equals',
            value: null,
          },
          {
            field: 'investmentObjective',
            operator: 'not_equals',
            value: null,
            logicalOperator: 'AND',
          },
          {
            field: 'timeHorizon',
            operator: 'not_equals',
            value: null,
            logicalOperator: 'AND',
          },
        ],
        remediation: 'Complete comprehensive suitability analysis and documentation',
        references: ['FINRA Rule 2111'],
        effectiveDate: new Date('2012-07-09'),
        lastUpdated: new Date(),
        version: '1.0',
      },
      {
        id: 'FINRA_CONCENTRATION_RISK',
        name: 'Portfolio Concentration Limits',
        description: 'Monitor portfolio concentration to manage risk',
        jurisdiction: 'US',
        category: 'FINRA',
        severity: 'MEDIUM',
        enabled: true,
        conditions: [
          {
            field: 'singleSecurityWeight',
            operator: 'less_than',
            value: 0.10, // 10% max per security
          },
          {
            field: 'sectorConcentration',
            operator: 'less_than',
            value: 0.25, // 25% max per sector
            logicalOperator: 'AND',
          },
        ],
        remediation: 'Diversify portfolio to reduce concentration risk',
        references: ['FINRA Rule 2111', 'Concentration Risk Guidelines'],
        effectiveDate: new Date('2012-07-09'),
        lastUpdated: new Date(),
        version: '1.0',
      },

      // GDPR Rules
      {
        id: 'GDPR_DATA_RETENTION',
        name: 'Data Retention Limits',
        description: 'Personal data must not be kept longer than necessary',
        jurisdiction: 'EU',
        category: 'GDPR',
        severity: 'HIGH',
        enabled: true,
        conditions: [
          {
            field: 'dataRetentionPeriod',
            operator: 'less_than',
            value: 2555, // 7 years in days
          },
          {
            field: 'hasLegalBasis',
            operator: 'equals',
            value: true,
            logicalOperator: 'AND',
          },
        ],
        remediation: 'Review and update data retention policies',
        references: ['GDPR Article 5(1)(e)', 'Recital 39'],
        effectiveDate: new Date('2018-05-25'),
        lastUpdated: new Date(),
        version: '1.0',
      },
      {
        id: 'GDPR_CONSENT_MANAGEMENT',
        name: 'Consent Management',
        description: 'Valid consent must be obtained for personal data processing',
        jurisdiction: 'EU',
        category: 'GDPR',
        severity: 'CRITICAL',
        enabled: true,
        conditions: [
          {
            field: 'hasValidConsent',
            operator: 'equals',
            value: true,
          },
          {
            field: 'consentDate',
            operator: 'greater_than',
            value: new Date('2018-05-25'),
            logicalOperator: 'AND',
          },
        ],
        remediation: 'Obtain or refresh valid consent from data subjects',
        references: ['GDPR Article 7', 'GDPR Article 4(11)'],
        effectiveDate: new Date('2018-05-25'),
        lastUpdated: new Date(),
        version: '1.0',
      },

      // FATCA Rules
      {
        id: 'FATCA_US_PERSON_REPORTING',
        name: 'US Person Reporting',
        description: 'Report US persons and their account information',
        jurisdiction: 'US',
        category: 'FATCA',
        severity: 'HIGH',
        enabled: true,
        conditions: [
          {
            field: 'isUSPerson',
            operator: 'equals',
            value: true,
          },
          {
            field: 'accountBalance',
            operator: 'greater_than',
            value: 50000,
            logicalOperator: 'AND',
          },
        ],
        remediation: 'Submit FATCA reporting forms to IRS',
        references: ['IRC Section 1471', '26 CFR 1.1471-1'],
        effectiveDate: new Date('2014-07-01'),
        lastUpdated: new Date(),
        version: '1.0',
      },

      // CRS Rules
      {
        id: 'CRS_ACCOUNT_HOLDER_IDENTIFICATION',
        name: 'Account Holder Identification',
        description: 'Identify and classify account holders for CRS reporting',
        jurisdiction: 'GLOBAL',
        category: 'CRS',
        severity: 'HIGH',
        enabled: true,
        conditions: [
          {
            field: 'hasTaxResidency',
            operator: 'equals',
            value: true,
          },
          {
            field: 'accountBalance',
            operator: 'greater_than',
            value: 250000,
            logicalOperator: 'AND',
          },
        ],
        remediation: 'Complete CRS self-certification and due diligence procedures',
        references: ['OECD CRS', 'Common Reporting Standard'],
        effectiveDate: new Date('2017-01-01'),
        lastUpdated: new Date(),
        version: '1.0',
      },
    ];

    // Load default rules
    for (const rule of defaultRules) {
      this.addRule(rule);
    }

    console.log(`Initialized ${defaultRules.length} default regulatory rules`);
  }

  public addRule(rule: RegulatoryRule): void {
    this.rules.set(rule.id, rule);
    
    // Update category index
    if (!this.rulesByCategory.has(rule.category)) {
      this.rulesByCategory.set(rule.category, []);
    }
    this.rulesByCategory.get(rule.category)!.push(rule);

    // Initialize performance metrics
    this.performanceMetrics.set(rule.id, {
      executionCount: 0,
      totalTime: 0,
      successCount: 0,
    });

    this.emit('ruleAdded', { ruleId: rule.id, category: rule.category });
  }

  public updateRule(ruleId: string, updates: Partial<RegulatoryRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    // Update rule
    const updatedRule = { ...rule, ...updates, lastUpdated: new Date() };
    this.rules.set(ruleId, updatedRule);

    // Update category index if category changed
    if (updates.category && updates.category !== rule.category) {
      // Remove from old category
      const oldCategoryRules = this.rulesByCategory.get(rule.category) || [];
      const index = oldCategoryRules.findIndex(r => r.id === ruleId);
      if (index >= 0) {
        oldCategoryRules.splice(index, 1);
      }

      // Add to new category
      if (!this.rulesByCategory.has(updates.category)) {
        this.rulesByCategory.set(updates.category, []);
      }
      this.rulesByCategory.get(updates.category)!.push(updatedRule);
    }

    this.emit('ruleUpdated', { ruleId, oldRule: rule, newRule: updatedRule });
    return true;
  }

  public removeRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    // Remove from main index
    this.rules.delete(ruleId);

    // Remove from category index
    const categoryRules = this.rulesByCategory.get(rule.category) || [];
    const index = categoryRules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      categoryRules.splice(index, 1);
    }

    // Remove performance metrics
    this.performanceMetrics.delete(ruleId);

    this.emit('ruleRemoved', { ruleId, category: rule.category });
    return true;
  }

  public async validateEntity(request: ComplianceValidationRequest): Promise<ComplianceValidationResult> {
    const startTime = Date.now();
    const entityData = request.entity.data;
    const rulesToValidate = request.rules 
      ? request.rules.map(id => this.rules.get(id)).filter(Boolean) as RegulatoryRule[]
      : Array.from(this.rules.values()).filter(rule => rule.enabled);

    const validationResults: RuleValidationResult[] = [];
    const recommendations: ComplianceRecommendation[] = [];

    for (const rule of rulesToValidate) {
      const ruleStartTime = Date.now();
      
      try {
        const result = await this.validateRule(rule, entityData, request);
        validationResults.push(result);

        // Generate recommendations for failed rules
        if (result.status === 'FAIL') {
          const recommendation = this.generateRecommendation(rule, result, entityData);
          if (recommendation) {
            recommendations.push(recommendation);
          }
        }

        // Update performance metrics
        const metrics = this.performanceMetrics.get(rule.id)!;
        metrics.executionCount++;
        metrics.totalTime += Date.now() - ruleStartTime;
        if (result.status === 'PASS' || result.status === 'WARNING') {
          metrics.successCount++;
        }

      } catch (error) {
        console.error(`Error validating rule ${rule.id}:`, error);
        validationResults.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          status: 'FAIL',
          severity: rule.severity,
          message: `Rule validation error: ${(error as Error).message}`,
          timestamp: new Date(),
        });
      }
    }

    // Calculate summary statistics
    const passedRules = validationResults.filter(r => r.status === 'PASS').length;
    const failedRules = validationResults.filter(r => r.status === 'FAIL').length;
    const warningRules = validationResults.filter(r => r.status === 'WARNING').length;
    const criticalViolations = validationResults.filter(r => r.status === 'FAIL' && r.severity === 'CRITICAL').length;

    // Determine overall status
    let overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'PARTIAL';
    if (criticalViolations > 0) {
      overallStatus = 'NON_COMPLIANT';
    } else if (failedRules > 0) {
      overallStatus = 'PARTIAL';
    } else if (warningRules > 0) {
      overallStatus = 'WARNING';
    } else {
      overallStatus = 'COMPLIANT';
    }

    const result: ComplianceValidationResult = {
      requestId: request.requestId,
      entityId: request.entity.id,
      entityType: request.entity.type,
      timestamp: new Date(),
      overallStatus,
      validatedRules: validationResults,
      summary: {
        totalRules: validationResults.length,
        passedRules,
        failedRules,
        warningRules,
        criticalViolations,
      },
      recommendations,
      metadata: {
        processingTime: Date.now() - startTime,
        dataQualityScore: this.calculateDataQualityScore(entityData),
        confidenceLevel: this.calculateConfidenceLevel(validationResults),
      },
    };

    this.emit('validationCompleted', result);
    return result;
  }

  private async validateRule(
    rule: RegulatoryRule,
    entityData: Record<string, any>,
    request: ComplianceValidationRequest
  ): Promise<RuleValidationResult> {
    const conditions = rule.conditions;
    let conditionResults: boolean[] = [];

    for (const condition of conditions) {
      const result = this.evaluateCondition(condition, entityData);
      conditionResults.push(result);
    }

    // Apply logical operators (simplified - assumes left-to-right evaluation)
    let finalResult = conditionResults[0];
    for (let i = 1; i < conditionResults.length; i++) {
      const operator = conditions[i].logicalOperator || 'AND';
      if (operator === 'AND') {
        finalResult = finalResult && conditionResults[i];
      } else if (operator === 'OR') {
        finalResult = finalResult || conditionResults[i];
      }
    }

    const status: 'PASS' | 'FAIL' | 'WARNING' = finalResult ? 'PASS' : 
      (rule.severity === 'LOW' || rule.severity === 'MEDIUM') ? 'WARNING' : 'FAIL';

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      status,
      severity: rule.severity,
      message: this.generateRuleMessage(rule, status, entityData),
      details: {
        actualValue: this.extractRelevantValues(rule.conditions, entityData),
        evidence: this.gatherEvidence(rule, entityData),
      },
      timestamp: new Date(),
    };
  }

  private evaluateCondition(condition: RegulatoryCondition, data: Record<string, any>): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      case 'contains':
        return String(fieldValue).includes(String(conditionValue));
      case 'not_contains':
        return !String(fieldValue).includes(String(conditionValue));
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      case 'regex':
        return new RegExp(conditionValue).test(String(fieldValue));
      case 'between':
        if (Array.isArray(conditionValue) && conditionValue.length === 2) {
          const numValue = Number(fieldValue);
          return numValue >= Number(conditionValue[0]) && numValue <= Number(conditionValue[1]);
        }
        return false;
      default:
        console.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private generateRuleMessage(rule: RegulatoryRule, status: string, data: Record<string, any>): string {
    if (status === 'PASS') {
      return `${rule.name}: Compliant`;
    } else {
      const violations = rule.conditions
        .filter(condition => !this.evaluateCondition(condition, data))
        .map(condition => `${condition.field} ${condition.operator} ${condition.value}`)
        .join(', ');
      
      return `${rule.name}: Non-compliant - ${violations}`;
    }
  }

  private extractRelevantValues(conditions: RegulatoryCondition[], data: Record<string, any>): Record<string, any> {
    const values: Record<string, any> = {};
    for (const condition of conditions) {
      values[condition.field] = this.getNestedValue(data, condition.field);
    }
    return values;
  }

  private gatherEvidence(rule: RegulatoryRule, data: Record<string, any>): string[] {
    const evidence: string[] = [];
    
    // Add relevant data points as evidence
    for (const condition of rule.conditions) {
      const value = this.getNestedValue(data, condition.field);
      if (value !== undefined && value !== null) {
        evidence.push(`${condition.field}: ${JSON.stringify(value)}`);
      }
    }

    return evidence;
  }

  private generateRecommendation(
    rule: RegulatoryRule,
    result: RuleValidationResult,
    data: Record<string, any>
  ): ComplianceRecommendation | null {
    if (result.status !== 'FAIL') {
      return null;
    }

    const priority = rule.severity === 'CRITICAL' ? 'CRITICAL' : 
                    rule.severity === 'HIGH' ? 'HIGH' : 
                    rule.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW';

    return {
      id: `rec_${rule.id}_${Date.now()}`,
      type: 'IMMEDIATE_ACTION',
      priority,
      title: `Address ${rule.name} Violation`,
      description: rule.description,
      action: rule.remediation || 'Review and update compliance procedures',
      estimatedEffort: this.estimateEffort(rule.severity),
      deadline: this.calculateDeadline(rule.severity),
      relatedRules: [rule.id],
      resources: rule.references,
    };
  }

  private estimateEffort(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return '1-2 days';
      case 'HIGH': return '3-5 days';
      case 'MEDIUM': return '1-2 weeks';
      case 'LOW': return '2-4 weeks';
      default: return '1 week';
    }
  }

  private calculateDeadline(severity: string): Date {
    const now = new Date();
    const days = severity === 'CRITICAL' ? 1 : 
                 severity === 'HIGH' ? 3 : 
                 severity === 'MEDIUM' ? 7 : 14;
    
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private calculateDataQualityScore(data: Record<string, any>): number {
    let totalFields = 0;
    let completeFields = 0;

    const checkObject = (obj: any, depth = 0): void => {
      if (depth > 3) return; // Prevent deep recursion
      
      for (const [key, value] of Object.entries(obj)) {
        totalFields++;
        if (value !== null && value !== undefined && value !== '') {
          completeFields++;
          
          if (typeof value === 'object' && !Array.isArray(value)) {
            checkObject(value, depth + 1);
          }
        }
      }
    };

    checkObject(data);
    
    return totalFields > 0 ? Math.round((completeFields / totalFields) * 100) : 0;
  }

  private calculateConfidenceLevel(results: RuleValidationResult[]): number {
    if (results.length === 0) return 0;
    
    const weights = {
      'CRITICAL': 1.0,
      'HIGH': 0.8,
      'MEDIUM': 0.6,
      'LOW': 0.4,
    };

    let totalWeight = 0;
    let passedWeight = 0;

    for (const result of results) {
      const weight = weights[result.severity] || 0.5;
      totalWeight += weight;
      
      if (result.status === 'PASS') {
        passedWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
  }

  public getRulesByCategory(category: string): RegulatoryRule[] {
    return this.rulesByCategory.get(category) || [];
  }

  public getAllRules(): RegulatoryRule[] {
    return Array.from(this.rules.values());
  }

  public getRule(ruleId: string): RegulatoryRule | undefined {
    return this.rules.get(ruleId);
  }

  public getPerformanceMetrics(): Array<{ ruleId: string; executionCount: number; averageExecutionTime: number; successRate: number }> {
    const metrics = [];
    
    for (const [ruleId, metric] of this.performanceMetrics.entries()) {
      metrics.push({
        ruleId,
        executionCount: metric.executionCount,
        averageExecutionTime: metric.executionCount > 0 ? metric.totalTime / metric.executionCount : 0,
        successRate: metric.executionCount > 0 ? (metric.successCount / metric.executionCount) * 100 : 0,
      });
    }

    return metrics;
  }

  public enableRule(ruleId: string): boolean {
    return this.updateRule(ruleId, { enabled: true });
  }

  public disableRule(ruleId: string): boolean {
    return this.updateRule(ruleId, { enabled: false });
  }

  public getEnabledRulesCount(): number {
    return Array.from(this.rules.values()).filter(rule => rule.enabled).length;
  }

  public getRulesByJurisdiction(jurisdiction: string): RegulatoryRule[] {
    return Array.from(this.rules.values()).filter(rule => 
      rule.jurisdiction === jurisdiction || rule.jurisdiction === 'GLOBAL'
    );
  }
}
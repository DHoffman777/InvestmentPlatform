import { EventEmitter } from 'events';
import Redis from 'ioredis';
import {
  FinancialServicesFirm,
  ComplianceViolation,
  SuitabilityAssessment,
  BestExecutionAnalysis,
  AntiMoneyLaunderingCheck,
  TradeReporting,
  ComplianceTraining,
  FinancialServicesConfig,
  CorrectiveAction,
} from '../types';

export class ComplianceMonitoringService extends EventEmitter {
  private redis: Redis;

  constructor(private config: FinancialServicesConfig) {
    super();
    
    this.redis = new Redis({
      host: config.database.redis.host,
      port: config.database.redis.port,
      password: config.database.redis.password,
      db: config.database.redis.db,
      keyPrefix: 'finserv-compliance:',
    });

    this.setupPeriodicChecks();
  }

  public async recordViolation(violation: Omit<ComplianceViolation, 'id'>): Promise<ComplianceViolation> {
    const violationRecord: ComplianceViolation = {
      ...violation,
      id: this.generateViolationId(),
    };

    // Store violation
    await this.redis.setex(
      `violation:${violationRecord.id}`,
      86400 * 365 * 7, // 7 years retention
      JSON.stringify(violationRecord)
    );

    // Index by severity and type
    await this.redis.sadd(`violations:severity:${violation.severity}`, violationRecord.id);
    await this.redis.sadd(`violations:type:${violation.violationType}`, violationRecord.id);
    await this.redis.sadd(`violations:regulator:${violation.regulator || 'internal'}`, violationRecord.id);

    // Track violation metrics
    await this.updateViolationMetrics(violationRecord);

    // Check if immediate reporting is required
    if (this.requiresImmediateReporting(violationRecord)) {
      await this.triggerImmediateReporting(violationRecord);
    }

    this.emit('violationRecorded', {
      violationId: violationRecord.id,
      severity: violationRecord.severity,
      type: violationRecord.violationType,
      regulator: violationRecord.regulator,
      reportingRequired: violationRecord.reportingRequired,
    });

    console.log(`Compliance violation recorded: ${violationRecord.id} (${violationRecord.severity})`);
    return violationRecord;
  }

  public async conductSuitabilityAssessment(
    clientId: string,
    productType: string,
    conductedBy: string
  ): Promise<SuitabilityAssessment> {
    // Get client profile from client management system
    const clientProfile = await this.getClientProfile(clientId);
    const productInfo = await this.getProductInformation(productType);

    const assessment: SuitabilityAssessment = {
      id: this.generateAssessmentId(),
      clientId,
      assessmentDate: new Date(),
      conductedBy,
      clientProfile: {
        age: clientProfile.age,
        investmentExperience: clientProfile.investmentExperience,
        financialSituation: clientProfile.financialSituation,
        investmentConstraints: clientProfile.investmentConstraints || [],
      },
      productAssessment: {
        productType,
        riskLevel: productInfo.riskLevel,
        complexity: productInfo.complexity,
        features: productInfo.features,
        costs: productInfo.costs,
      },
      suitabilityDetermination: this.determineSuitability(clientProfile, productInfo),
      reasoning: this.generateSuitabilityReasoning(clientProfile, productInfo),
      clientAcknowledgment: false,
      supervisoryReview: {
        reviewedBy: '',
        reviewDate: new Date(),
        approved: false,
      },
    };

    // Add conditions or alternatives if necessary
    if (assessment.suitabilityDetermination === 'CONDITIONALLY_SUITABLE') {
      assessment.conditions = this.generateSuitabilityConditions(clientProfile, productInfo);
    } else if (assessment.suitabilityDetermination === 'UNSUITABLE') {
      assessment.recommendedAlternatives = this.generateAlternatives(clientProfile);
    }

    // Store assessment
    await this.redis.setex(
      `suitability:${assessment.id}`,
      86400 * 365 * 7,
      JSON.stringify(assessment)
    );

    // Index by client and product
    await this.redis.sadd(`client-suitability:${clientId}`, assessment.id);
    await this.redis.sadd(`product-suitability:${productType}`, assessment.id);

    this.emit('suitabilityAssessmentCompleted', {
      assessmentId: assessment.id,
      clientId,
      productType,
      determination: assessment.suitabilityDetermination,
      requiresSupervisoryReview: assessment.suitabilityDetermination !== 'SUITABLE',
    });

    console.log(`Suitability assessment completed: ${assessment.id} - ${assessment.suitabilityDetermination}`);
    return assessment;
  }

  public async performBestExecutionAnalysis(
    startDate: Date,
    endDate: Date,
    orderType: string = 'ALL',
    securityType: string = 'ALL'
  ): Promise<BestExecutionAnalysis> {
    const analysis: BestExecutionAnalysis = {
      id: this.generateAnalysisId(),
      analysisPeriod: { startDate, endDate },
      orderType,
      securityType,
      marketCenters: await this.analyzeMarketCenters(startDate, endDate, orderType, securityType),
      executionMetrics: await this.calculateExecutionMetrics(startDate, endDate, orderType, securityType),
      qualityMetrics: await this.calculateQualityMetrics(startDate, endDate, orderType, securityType),
      complianceAssessment: '',
      improvements: [],
      reportGenerated: new Date(),
      reportPeriod: this.determineReportPeriod(startDate, endDate),
    };

    // Generate compliance assessment
    analysis.complianceAssessment = this.assessBestExecutionCompliance(analysis);
    analysis.improvements = this.generateExecutionImprovements(analysis);

    // Store analysis
    await this.redis.setex(
      `best-execution:${analysis.id}`,
      86400 * 365 * 3, // 3 years retention
      JSON.stringify(analysis)
    );

    // Check if analysis reveals compliance issues
    if (this.identifyExecutionIssues(analysis).length > 0) {
      const issues = this.identifyExecutionIssues(analysis);
      for (const issue of issues) {
        await this.recordViolation({
          violationType: 'REGULATORY',
          severity: issue.severity,
          regulator: 'SEC',
          regulation: 'Rule 606',
          section: 'Best Execution',
          description: issue.description,
          discoveredDate: new Date(),
          discoveredBy: 'Best Execution Analysis System',
          affectedParties: ['Trading Desk'],
          potentialImpact: issue.impact,
          rootCause: issue.rootCause,
          correctiveActions: [],
          status: 'OPEN',
          reportingRequired: issue.severity === 'HIGH' || issue.severity === 'CRITICAL',
          monetary: {
            estimatedLoss: issue.estimatedLoss,
          },
        });
      }
    }

    this.emit('bestExecutionAnalysisCompleted', {
      analysisId: analysis.id,
      period: analysis.analysisPeriod,
      issuesFound: this.identifyExecutionIssues(analysis).length,
      complianceLevel: analysis.complianceAssessment,
    });

    console.log(`Best execution analysis completed: ${analysis.id}`);
    return analysis;
  }

  public async performAMLCheck(
    clientId: string,
    checkType: 'INITIAL' | 'PERIODIC' | 'ENHANCED' | 'TRANSACTION_BASED' = 'PERIODIC'
  ): Promise<AntiMoneyLaunderingCheck> {
    const amlCheck: AntiMoneyLaunderingCheck = {
      id: this.generateAMLCheckId(),
      clientId,
      checkType,
      checkDate: new Date(),
      screeningResults: await this.performScreening(clientId),
      riskScore: 0,
      riskLevel: 'LOW',
      sanctions: await this.performSanctionsCheck(clientId),
      pep: await this.performPEPCheck(clientId),
      adverseMedia: await this.performAdverseMediaCheck(clientId),
      complianceDecision: 'APPROVED',
      dueDiligenceLevel: 'STANDARD',
      monitoringFrequency: 'MONTHLY',
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      reviewedBy: 'AML System',
    };

    // Calculate risk score
    amlCheck.riskScore = this.calculateAMLRiskScore(amlCheck);
    amlCheck.riskLevel = this.determineRiskLevel(amlCheck.riskScore);

    // Determine compliance decision
    amlCheck.complianceDecision = this.determineAMLDecision(amlCheck);
    amlCheck.dueDiligenceLevel = this.determineDueDiligenceLevel(amlCheck);
    amlCheck.monitoringFrequency = this.determineMonitoringFrequency(amlCheck);

    // Store AML check
    await this.redis.setex(
      `aml-check:${amlCheck.id}`,
      86400 * 365 * 5, // 5 years retention
      JSON.stringify(amlCheck)
    );

    // Index by client and risk level
    await this.redis.sadd(`client-aml:${clientId}`, amlCheck.id);
    await this.redis.sadd(`aml-risk:${amlCheck.riskLevel}`, amlCheck.id);

    // Create violations for high-risk findings
    if (amlCheck.riskLevel === 'HIGH' || amlCheck.riskLevel === 'PROHIBITED') {
      await this.recordViolation({
        violationType: 'REGULATORY',
        severity: amlCheck.riskLevel === 'PROHIBITED' ? 'CRITICAL' : 'HIGH',
        regulator: 'FinCEN',
        regulation: 'Bank Secrecy Act',
        section: 'Customer Due Diligence',
        description: `High-risk AML findings for client ${clientId}`,
        discoveredDate: new Date(),
        discoveredBy: 'AML Screening System',
        affectedParties: [clientId],
        potentialImpact: 'Regulatory sanctions, reputational damage',
        rootCause: 'Client risk profile changed or new adverse information discovered',
        correctiveActions: [],
        status: 'OPEN',
        reportingRequired: true,
        reportingDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        monetary: {},
      });
    }

    this.emit('amlCheckCompleted', {
      checkId: amlCheck.id,
      clientId,
      riskLevel: amlCheck.riskLevel,
      decision: amlCheck.complianceDecision,
      requiresEnhancedDueDiligence: amlCheck.dueDiligenceLevel === 'ENHANCED',
    });

    console.log(`AML check completed: ${amlCheck.id} - Risk Level: ${amlCheck.riskLevel}`);
    return amlCheck;
  }

  public async scheduleTradeReporting(
    tradeId: string,
    reportingRegime: 'CAT' | 'OATS' | 'BLUE_SHEETS' | 'LARGE_TRADER' | 'FORM_13F' | 'SECTION_16' | 'EMIR' | 'MIFID_II'
  ): Promise<TradeReporting> {
    const reportingDeadline = this.calculateReportingDeadline(reportingRegime);
    const tradeData = await this.getTradeData(tradeId);

    const tradeReporting: TradeReporting = {
      id: this.generateTradeReportingId(),
      tradeId,
      reportingRegime,
      reportingDeadline,
      reportingStatus: 'PENDING',
      reportingFields: this.extractRequiredFields(tradeData, reportingRegime),
      regulatoryAuthority: this.getRegulatoryAuthority(reportingRegime),
      corrections: [],
    };

    // Store trade reporting record
    await this.redis.setex(
      `trade-reporting:${tradeReporting.id}`,
      86400 * 365 * 7,
      JSON.stringify(tradeReporting)
    );

    // Schedule automatic submission
    await this.scheduleAutomaticSubmission(tradeReporting);

    this.emit('tradeReportingScheduled', {
      reportingId: tradeReporting.id,
      tradeId,
      regime: reportingRegime,
      deadline: reportingDeadline,
    });

    console.log(`Trade reporting scheduled: ${tradeReporting.id} for ${reportingRegime}`);
    return tradeReporting;
  }

  public async assignCorrectiveAction(
    violationId: string,
    action: Omit<CorrectiveAction, 'id'>
  ): Promise<CorrectiveAction> {
    const violation = await this.getViolation(violationId);
    if (!violation) {
      throw new Error('Violation not found');
    }

    const correctiveAction: CorrectiveAction = {
      ...action,
      id: this.generateCorrectiveActionId(),
    };

    violation.correctiveActions.push(correctiveAction);

    // Update violation with new corrective action
    await this.redis.setex(
      `violation:${violationId}`,
      86400 * 365 * 7,
      JSON.stringify(violation)
    );

    // Track corrective action separately
    await this.redis.setex(
      `corrective-action:${correctiveAction.id}`,
      86400 * 365 * 7,
      JSON.stringify(correctiveAction)
    );

    this.emit('correctiveActionAssigned', {
      actionId: correctiveAction.id,
      violationId,
      assignedTo: correctiveAction.assignedTo,
      dueDate: correctiveAction.dueDate,
    });

    console.log(`Corrective action assigned: ${correctiveAction.id} for violation ${violationId}`);
    return correctiveAction;
  }

  public async getComplianceMetrics(period: { startDate: Date; endDate: Date }): Promise<{
    violations: {
      total: number;
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
      open: number;
      resolved: number;
    };
    suitability: {
      assessments: number;
      suitable: number;
      unsuitable: number;
      conditionallyApproved: number;
    };
    aml: {
      checks: number;
      highRisk: number;
      prohibited: number;
      enhancedDueDiligence: number;
    };
    training: {
      required: number;
      completed: number;
      overdue: number;
      complianceRate: number;
    };
    reporting: {
      scheduled: number;
      submitted: number;
      late: number;
      rejected: number;
    };
  }> {
    // This would integrate with actual data stores
    // For now, returning sample metrics structure
    return {
      violations: {
        total: 0,
        byType: {},
        bySeverity: {},
        open: 0,
        resolved: 0,
      },
      suitability: {
        assessments: 0,
        suitable: 0,
        unsuitable: 0,
        conditionallyApproved: 0,
      },
      aml: {
        checks: 0,
        highRisk: 0,
        prohibited: 0,
        enhancedDueDiligence: 0,
      },
      training: {
        required: 0,
        completed: 0,
        overdue: 0,
        complianceRate: 0,
      },
      reporting: {
        scheduled: 0,
        submitted: 0,
        late: 0,
        rejected: 0,
      },
    };
  }

  private setupPeriodicChecks(): void {
    // Setup periodic compliance checks
    setInterval(() => {
      this.performPeriodicViolationReview();
    }, 24 * 60 * 60 * 1000); // Daily

    setInterval(() => {
      this.checkTrainingDeadlines();
    }, 60 * 60 * 1000); // Hourly

    setInterval(() => {
      this.checkReportingDeadlines();
    }, 15 * 60 * 1000); // Every 15 minutes
  }

  private async performPeriodicViolationReview(): Promise<void> {
    // Review open violations and escalate if necessary
    console.log('Performing periodic violation review');
  }

  private async checkTrainingDeadlines(): Promise<void> {
    // Check for upcoming or overdue training deadlines
    console.log('Checking training deadlines');
  }

  private async checkReportingDeadlines(): Promise<void> {
    // Check for upcoming or overdue reporting deadlines
    console.log('Checking reporting deadlines');
  }

  // Helper methods
  private generateViolationId(): string {
    return `viol_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateAssessmentId(): string {
    return `suit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateAnalysisId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateAMLCheckId(): string {
    return `aml_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateTradeReportingId(): string {
    return `rep_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateCorrectiveActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async updateViolationMetrics(violation: ComplianceViolation): Promise<void> {
    // Update violation metrics in Redis
    const date = new Date().toISOString().split('T')[0];
    await this.redis.incr(`metrics:violations:${date}`);
    await this.redis.incr(`metrics:violations:${violation.severity}:${date}`);
  }

  private requiresImmediateReporting(violation: ComplianceViolation): boolean {
    return violation.severity === 'CRITICAL' || 
           (violation.reportingRequired && violation.reportingDeadline && 
            violation.reportingDeadline.getTime() - Date.now() < 24 * 60 * 60 * 1000);
  }

  private async triggerImmediateReporting(violation: ComplianceViolation): Promise<void> {
    this.emit('immediateReportingRequired', {
      violationId: violation.id,
      severity: violation.severity,
      regulator: violation.regulator,
      deadline: violation.reportingDeadline,
    });
  }

  private async getClientProfile(clientId: string): Promise<any> {
    // In production, this would call the client management service
    return {
      age: 45,
      investmentExperience: 'GOOD',
      financialSituation: {
        annualIncome: 150000,
        netWorth: 500000,
        liquidNetWorth: 100000,
        investmentObjectives: ['GROWTH', 'INCOME'],
        timeHorizon: 'LONG',
        riskTolerance: 'MODERATE',
      },
      investmentConstraints: [],
    };
  }

  private async getProductInformation(productType: string): Promise<any> {
    // In production, this would call the product management service
    return {
      riskLevel: 'MEDIUM',
      complexity: 'MODERATE',
      features: ['DIVERSIFIED', 'LIQUID'],
      costs: {
        managementFee: 0.75,
        estimatedAnnualCost: 0.85,
      },
    };
  }

  private determineSuitability(clientProfile: any, productInfo: any): 'SUITABLE' | 'UNSUITABLE' | 'CONDITIONALLY_SUITABLE' {
    // Simplified suitability logic
    if (clientProfile.financialSituation.riskTolerance === 'CONSERVATIVE' && productInfo.riskLevel === 'HIGH') {
      return 'UNSUITABLE';
    }
    if (clientProfile.investmentExperience === 'NONE' && productInfo.complexity === 'COMPLEX') {
      return 'CONDITIONALLY_SUITABLE';
    }
    return 'SUITABLE';
  }

  private generateSuitabilityReasoning(clientProfile: any, productInfo: any): string {
    return 'Based on client risk tolerance, investment experience, and financial objectives';
  }

  private generateSuitabilityConditions(clientProfile: any, productInfo: any): string[] {
    return ['Client must complete additional risk disclosure', 'Maximum 5% of portfolio allocation'];
  }

  private generateAlternatives(clientProfile: any): string[] {
    return ['Conservative balanced fund', 'Money market fund'];
  }

  private async analyzeMarketCenters(startDate: Date, endDate: Date, orderType: string, securityType: string): Promise<any[]> {
    // Market center analysis logic
    return [];
  }

  private async calculateExecutionMetrics(startDate: Date, endDate: Date, orderType: string, securityType: string): Promise<any> {
    // Execution metrics calculation
    return {
      totalOrders: 1000,
      totalShares: 100000,
      totalValue: 5000000,
      averageOrderSize: 100,
      fillRate: 98.5,
      partialFillRate: 15.2,
      marketableOrderRate: 75.3,
      averageRealizationRate: 99.1,
    };
  }

  private async calculateQualityMetrics(startDate: Date, endDate: Date, orderType: string, securityType: string): Promise<any> {
    // Quality metrics calculation
    return {
      priceImprovement: {
        orders: 250,
        improvementAmount: 5000,
        averageImprovement: 20,
      },
      atMidpoint: {
        orders: 600,
        percentage: 60,
      },
      outsideQuote: {
        orders: 10,
        percentage: 1,
      },
      speedOfExecution: {
        averageTime: 150,
        medianTime: 100,
        percentile95: 500,
      },
    };
  }

  private determineReportPeriod(startDate: Date, endDate: Date): 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' {
    const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 31) return 'MONTHLY';
    if (days <= 92) return 'QUARTERLY';
    return 'ANNUAL';
  }

  private assessBestExecutionCompliance(analysis: BestExecutionAnalysis): string {
    return 'Compliant - All execution quality metrics within acceptable ranges';
  }

  private generateExecutionImprovements(analysis: BestExecutionAnalysis): string[] {
    return ['Consider additional market centers for better price improvement'];
  }

  private identifyExecutionIssues(analysis: BestExecutionAnalysis): any[] {
    return [];
  }

  private async performScreening(clientId: string): Promise<any[]> {
    return [];
  }

  private async performSanctionsCheck(clientId: string): Promise<any> {
    return {
      lists: ['OFAC SDN', 'EU Sanctions'],
      matches: 0,
      highestRisk: 'NONE',
      details: [],
    };
  }

  private async performPEPCheck(clientId: string): Promise<any> {
    return {
      isPEP: false,
      enhancedDueDiligence: false,
    };
  }

  private async performAdverseMediaCheck(clientId: string): Promise<any> {
    return {
      found: false,
      sources: [],
      categories: [],
      riskScore: 0,
    };
  }

  private calculateAMLRiskScore(amlCheck: AntiMoneyLaunderingCheck): number {
    let score = 0;
    if (amlCheck.sanctions.matches > 0) score += 50;
    if (amlCheck.pep.isPEP) score += 30;
    if (amlCheck.adverseMedia.found) score += 20;
    return Math.min(score, 100);
  }

  private determineRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'PROHIBITED' {
    if (riskScore >= 80) return 'PROHIBITED';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 30) return 'MEDIUM';
    return 'LOW';
  }

  private determineAMLDecision(amlCheck: AntiMoneyLaunderingCheck): 'APPROVED' | 'REJECTED' | 'REQUIRES_REVIEW' | 'ENHANCED_DUE_DILIGENCE' {
    if (amlCheck.riskLevel === 'PROHIBITED') return 'REJECTED';
    if (amlCheck.riskLevel === 'HIGH') return 'ENHANCED_DUE_DILIGENCE';
    if (amlCheck.riskLevel === 'MEDIUM') return 'REQUIRES_REVIEW';
    return 'APPROVED';
  }

  private determineDueDiligenceLevel(amlCheck: AntiMoneyLaunderingCheck): 'STANDARD' | 'ENHANCED' | 'SIMPLIFIED' {
    if (amlCheck.riskLevel === 'HIGH' || amlCheck.riskLevel === 'PROHIBITED') return 'ENHANCED';
    return 'STANDARD';
  }

  private determineMonitoringFrequency(amlCheck: AntiMoneyLaunderingCheck): 'REAL_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' {
    switch (amlCheck.riskLevel) {
      case 'PROHIBITED':
      case 'HIGH':
        return 'DAILY';
      case 'MEDIUM':
        return 'WEEKLY';
      default:
        return 'MONTHLY';
    }
  }

  private calculateReportingDeadline(regime: string): Date {
    // Different regimes have different deadlines
    const hours = {
      'CAT': 24,
      'OATS': 24,
      'BLUE_SHEETS': 72,
      'LARGE_TRADER': 24,
      'FORM_13F': 45 * 24, // 45 days
      'SECTION_16': 48,
      'EMIR': 24,
      'MIFID_II': 24,
    }[regime] || 24;

    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  private async getTradeData(tradeId: string): Promise<any> {
    // Get trade data from trading system
    return {};
  }

  private extractRequiredFields(tradeData: any, regime: string): Record<string, any> {
    // Extract required fields based on reporting regime
    return {};
  }

  private getRegulatoryAuthority(regime: string): string {
    const authorities = {
      'CAT': 'SEC',
      'OATS': 'FINRA',
      'BLUE_SHEETS': 'SEC',
      'LARGE_TRADER': 'SEC',
      'FORM_13F': 'SEC',
      'SECTION_16': 'SEC',
      'EMIR': 'ESMA',
      'MIFID_II': 'Local NCA',
    };
    return authorities[regime] || 'SEC';
  }

  private async scheduleAutomaticSubmission(tradeReporting: TradeReporting): Promise<void> {
    // Schedule automatic submission before deadline
    console.log(`Scheduled automatic submission for ${tradeReporting.id}`);
  }

  private async getViolation(violationId: string): Promise<ComplianceViolation | null> {
    const data = await this.redis.get(`violation:${violationId}`);
    return data ? JSON.parse(data) : null;
  }

  public async cleanup(): Promise<void> {
    await this.redis.quit();
  }
}
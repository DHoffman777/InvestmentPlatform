import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface TradeOrder {
  id: string;
  counterpartyId: string;
  securityId: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  currency: string;
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK';
  settlementDate: Date;
  portfolioId: string;
  traderId: string;
  createdAt: Date;
}

export interface RiskCheckResult {
  checkId: string;
  orderId: string;
  checkType: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'PENDING';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  details?: any;
  threshold?: number;
  actualValue?: number;
  recommendedAction?: string;
  bypassable: boolean;
  bypassReason?: string;
  bypassedBy?: string;
  executedAt: Date;
  executionTimeMs: number;
}

export interface RiskCheckSuite {
  suiteId: string;
  orderId: string;
  suiteName: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  overallStatus: 'PASS' | 'FAIL' | 'WARNING' | 'PENDING';
  canProceed: boolean;
  requiresApproval: boolean;
  results: RiskCheckResult[];
  executedAt: Date;
  completedAt?: Date;
  totalExecutionTimeMs?: number;
}

export interface RiskLimit {
  id: string;
  limitType: 'POSITION' | 'NOTIONAL' | 'CONCENTRATION' | 'EXPOSURE' | 'CREDIT' | 'LEVERAGE' | 'VAR' | 'SECTOR' | 'COUNTRY';
  entityType: 'PORTFOLIO' | 'COUNTERPARTY' | 'SECURITY' | 'TRADER' | 'ACCOUNT';
  entityId: string;
  limitValue: number;
  currency?: string;
  warningThreshold: number; // percentage of limit
  breachThreshold: number; // percentage of limit
  utilizationValue: number;
  utilizationPercentage: number;
  isActive: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
  reviewDate: Date;
  approvedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceRule {
  id: string;
  ruleName: string;
  ruleType: 'REGULATORY' | 'INTERNAL' | 'CLIENT_SPECIFIC' | 'RISK_MANAGEMENT';
  description: string;
  isActive: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  applicableSecurityTypes: string[];
  applicableCounterparties?: string[];
  applicablePortfolios?: string[];
  ruleLogic: string; // JSON string containing rule conditions
  violationAction: 'BLOCK' | 'WARN' | 'REQUIRE_APPROVAL' | 'LOG_ONLY';
  effectiveDate: Date;
  expiryDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettlementCapacity {
  counterpartyId: string;
  securityType: string;
  currency: string;
  maxDailyVolume: number;
  maxDailyNotional: number;
  currentDailyVolume: number;
  currentDailyNotional: number;
  availableCapacity: number;
  utilizationPercentage: number;
  lastUpdated: Date;
}

export interface LiquidityCheck {
  securityId: string;
  requiredQuantity: number;
  side: 'BUY' | 'SELL';
  availableLiquidity: number;
  liquidityRatio: number;
  averageDailyVolume: number;
  marketImpact: number;
  liquidityScore: number; // 0-100
  liquidityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedMaxQuantity?: number;
}

export class PreSettlementRiskChecksService extends EventEmitter {
  private riskLimits: Map<string, RiskLimit[]>;
  private complianceRules: Map<string, ComplianceRule>;
  private settlementCapacities: Map<string, SettlementCapacity[]>;
  private riskCheckHistory: Map<string, RiskCheckSuite[]>;

  // Risk check implementations
  private readonly RISK_CHECKS = new Map([
    ['POSITION_LIMIT_CHECK', this.checkPositionLimits.bind(this)],
    ['COUNTERPARTY_EXPOSURE_CHECK', this.checkCounterpartyExposure.bind(this)],
    ['CONCENTRATION_LIMIT_CHECK', this.checkConcentrationLimits.bind(this)],
    ['CREDIT_LIMIT_CHECK', this.checkCreditLimits.bind(this)],
    ['SETTLEMENT_CAPACITY_CHECK', this.checkSettlementCapacity.bind(this)],
    ['LIQUIDITY_CHECK', this.checkLiquidity.bind(this)],
    ['REGULATORY_COMPLIANCE_CHECK', this.checkRegulatoryCompliance.bind(this)],
    ['INTERNAL_POLICY_CHECK', this.checkInternalPolicies.bind(this)],
    ['MARKET_HOURS_CHECK', this.checkMarketHours.bind(this)],
    ['SETTLEMENT_DATE_CHECK', this.checkSettlementDate.bind(this)],
    ['PRICE_REASONABLENESS_CHECK', this.checkPriceReasonableness.bind(this)],
    ['CROSS_TRADE_CHECK', this.checkCrossTrades.bind(this)],
    ['WASH_TRADE_CHECK', this.checkWashTrades.bind(this)],
    ['RESTRICTED_SECURITY_CHECK', this.checkRestrictedSecurities.bind(this)],
    ['KYC_AML_CHECK', this.checkKycAml.bind(this)]
  ]);

  constructor() {
    super();
    this.riskLimits = new Map();
    this.complianceRules = new Map();
    this.settlementCapacities = new Map();
    this.riskCheckHistory = new Map();
  }

  public async executePreSettlementChecks(order: TradeOrder, checkTypes?: string[]): Promise<RiskCheckSuite> {
    const startTime = Date.now();
    const suiteId = uuidv4();
    
    const checksToRun = checkTypes || Array.from(this.RISK_CHECKS.keys());
    const results: RiskCheckResult[] = [];

    const suite: RiskCheckSuite = {
      suiteId,
      orderId: order.id,
      suiteName: 'Pre-Settlement Risk Checks',
      totalChecks: checksToRun.length,
      passedChecks: 0,
      failedChecks: 0,
      warningChecks: 0,
      overallStatus: 'PENDING',
      canProceed: false,
      requiresApproval: false,
      results: [],
      executedAt: new Date()
    };

    try {
      // Execute each risk check
      for (const checkType of checksToRun) {
        const checkFunction = this.RISK_CHECKS.get(checkType);
        if (checkFunction) {
          try {
            const result = await checkFunction(order);
            results.push(result);
            
            // Update counters based on result status
            switch (result.status) {
              case 'PASS':
                suite.passedChecks++;
                break;
              case 'FAIL':
                suite.failedChecks++;
                break;
              case 'WARNING':
                suite.warningChecks++;
                break;
            }

            // Check if approval is required
            if (result.severity === 'HIGH' || result.severity === 'CRITICAL') {
              suite.requiresApproval = true;
            }

          } catch (error: any) {
            // Create failed result for check execution error
            const errorResult: RiskCheckResult = {
              checkId: uuidv4(),
              orderId: order.id,
              checkType,
              status: 'FAIL',
              severity: 'HIGH',
              message: `Risk check execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              bypassable: false,
              executedAt: new Date(),
              executionTimeMs: 0
            };
            results.push(errorResult);
            suite.failedChecks++;
            suite.requiresApproval = true;
          }
        }
      }

      // Determine overall status and whether trade can proceed
      suite.results = results;
      suite.overallStatus = this.determineOverallStatus(results);
      suite.canProceed = this.canTradeProceed(results);
      suite.completedAt = new Date();
      suite.totalExecutionTimeMs = Date.now() - startTime;

      // Store check history
      const history = this.riskCheckHistory.get(order.id) || [];
      history.push(suite);
      this.riskCheckHistory.set(order.id, history);

      this.emit('riskCheckSuiteCompleted', suite);

      // Emit specific events based on results
      if (suite.overallStatus === 'FAIL') {
        this.emit('riskCheckFailed', suite);
      } else if (suite.requiresApproval) {
        this.emit('riskCheckRequiresApproval', suite);
      } else if (suite.overallStatus === 'PASS') {
        this.emit('riskCheckPassed', suite);
      }

      return suite;

    } catch (error: any) {
      suite.overallStatus = 'FAIL';
      suite.canProceed = false;
      suite.completedAt = new Date();
      suite.totalExecutionTimeMs = Date.now() - startTime;
      
      this.emit('riskCheckSuiteError', { suite, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private determineOverallStatus(results: RiskCheckResult[]): 'PASS' | 'FAIL' | 'WARNING' | 'PENDING' {
    const hasFailed = results.some(r => r.status === 'FAIL');
    const hasWarnings = results.some(r => r.status === 'WARNING');
    const hasPending = results.some(r => r.status === 'PENDING');

    if (hasFailed) return 'FAIL';
    if (hasPending) return 'PENDING';
    if (hasWarnings) return 'WARNING';
    return 'PASS';
  }

  private canTradeProceed(results: RiskCheckResult[]): boolean {
    // Trade cannot proceed if any non-bypassable checks failed
    const criticalFailures = results.filter(r => 
      r.status === 'FAIL' && 
      !r.bypassable && 
      (r.severity === 'HIGH' || r.severity === 'CRITICAL')
    );

    return criticalFailures.length === 0;
  }

  // Individual Risk Check Implementations

  private async checkPositionLimits(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const positionLimits = this.getEntityLimits(order.portfolioId, 'POSITION');
      const currentPosition = await this.getCurrentPosition(order.portfolioId, order.securityId);
      const newPosition = order.side === 'BUY' ? 
        currentPosition + order.quantity : 
        currentPosition - order.quantity;

      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Position limits check passed';
      let recommendedAction: string | undefined;

      for (const limit of positionLimits) {
        const utilizationPercentage = Math.abs(newPosition) / limit.limitValue * 100;
        
        if (utilizationPercentage > limit.breachThreshold) {
          status = 'FAIL';
          severity = 'HIGH';
          message = `Position limit breach: ${utilizationPercentage.toFixed(1)}% of limit`;
          recommendedAction = 'Reduce order quantity or obtain limit increase approval';
          break;
        } else if (utilizationPercentage > limit.warningThreshold) {
          status = 'WARNING';
          severity = 'MEDIUM';
          message = `Position limit warning: ${utilizationPercentage.toFixed(1)}% of limit`;
          recommendedAction = 'Monitor position closely';
        }
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'POSITION_LIMIT_CHECK',
        status,
        severity,
        message,
        details: { currentPosition, newPosition, limits: positionLimits.length },
        recommendedAction,
        bypassable: status !== 'FAIL' || severity === 'INFO',
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'POSITION_LIMIT_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkCounterpartyExposure(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const exposureLimits = this.getEntityLimits(order.counterpartyId, 'EXPOSURE');
      const currentExposure = await this.getCurrentCounterpartyExposure(order.counterpartyId);
      const orderValue = order.quantity * order.price;
      const newExposure = currentExposure + orderValue;

      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Counterparty exposure check passed';
      let recommendedAction: string | undefined;
      let utilizationPercentage = 0;

      for (const limit of exposureLimits) {
        utilizationPercentage = newExposure / limit.limitValue * 100;
        
        if (utilizationPercentage > limit.breachThreshold) {
          status = 'FAIL';
          severity = 'HIGH';
          message = `Counterparty exposure limit breach: ${utilizationPercentage.toFixed(1)}% of limit`;
          recommendedAction = 'Reduce order size or require additional collateral';
          break;
        } else if (utilizationPercentage > limit.warningThreshold) {
          status = 'WARNING';
          severity = 'MEDIUM';
          message = `Counterparty exposure warning: ${utilizationPercentage.toFixed(1)}% of limit`;
          recommendedAction = 'Monitor exposure closely';
        }
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'COUNTERPARTY_EXPOSURE_CHECK',
        status,
        severity,
        message,
        details: { currentExposure, newExposure, orderValue },
        actualValue: utilizationPercentage,
        threshold: exposureLimits[0]?.breachThreshold,
        recommendedAction,
        bypassable: status !== 'FAIL' || severity === 'INFO',
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'COUNTERPARTY_EXPOSURE_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkConcentrationLimits(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const concentrationLimits = this.getEntityLimits(order.portfolioId, 'CONCENTRATION');
      const portfolioValue = await this.getPortfolioValue(order.portfolioId);
      const securityValue = await this.getCurrentSecurityValue(order.portfolioId, order.securityId);
      const orderValue = order.quantity * order.price;
      const newSecurityValue = order.side === 'BUY' ? securityValue + orderValue : securityValue - orderValue;
      const concentrationPercentage = (newSecurityValue / portfolioValue) * 100;

      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Concentration limits check passed';
      let recommendedAction: string | undefined;

      for (const limit of concentrationLimits) {
        if (concentrationPercentage > limit.breachThreshold) {
          status = 'FAIL';
          severity = 'HIGH';
          message = `Concentration limit breach: ${concentrationPercentage.toFixed(1)}% of portfolio`;
          recommendedAction = 'Diversify holdings or obtain concentration limit waiver';
          break;
        } else if (concentrationPercentage > limit.warningThreshold) {
          status = 'WARNING';
          severity = 'MEDIUM';
          message = `Concentration warning: ${concentrationPercentage.toFixed(1)}% of portfolio`;
          recommendedAction = 'Consider portfolio diversification';
        }
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'CONCENTRATION_LIMIT_CHECK',
        status,
        severity,
        message,
        details: { portfolioValue, securityValue, newSecurityValue, concentrationPercentage },
        actualValue: concentrationPercentage,
        threshold: concentrationLimits[0]?.breachThreshold,
        recommendedAction,
        bypassable: status !== 'FAIL',
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'CONCENTRATION_LIMIT_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkCreditLimits(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const creditLimits = this.getEntityLimits(order.counterpartyId, 'CREDIT');
      const currentCreditExposure = await this.getCurrentCreditExposure(order.counterpartyId);
      const orderCreditRisk = await this.calculateOrderCreditRisk(order);
      const newCreditExposure = currentCreditExposure + orderCreditRisk;

      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Credit limits check passed';
      let recommendedAction: string | undefined;

      for (const limit of creditLimits) {
        const utilizationPercentage = newCreditExposure / limit.limitValue * 100;
        
        if (utilizationPercentage > limit.breachThreshold) {
          status = 'FAIL';
          severity = 'CRITICAL';
          message = `Credit limit breach: ${utilizationPercentage.toFixed(1)}% of limit`;
          recommendedAction = 'Require credit enhancement or reduce exposure';
          break;
        } else if (utilizationPercentage > limit.warningThreshold) {
          status = 'WARNING';
          severity = 'MEDIUM';
          message = `Credit limit warning: ${utilizationPercentage.toFixed(1)}% of limit`;
          recommendedAction = 'Monitor credit exposure closely';
        }
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'CREDIT_LIMIT_CHECK',
        status,
        severity,
        message,
        details: { currentCreditExposure, orderCreditRisk, newCreditExposure },
        recommendedAction,
        bypassable: status !== 'FAIL',
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'CREDIT_LIMIT_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkSettlementCapacity(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const capacity = await this.getSettlementCapacity(order.counterpartyId, order.securityId);
      const orderNotional = order.quantity * order.price;
      
      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Settlement capacity check passed';
      let recommendedAction: string | undefined;

      if (capacity) {
        const newUtilization = ((capacity.currentDailyNotional + orderNotional) / capacity.maxDailyNotional) * 100;
        
        if (newUtilization > 100) {
          status = 'FAIL';
          severity = 'HIGH';
          message = `Settlement capacity exceeded: ${newUtilization.toFixed(1)}% of daily capacity`;
          recommendedAction = 'Defer settlement to next business day or split order';
        } else if (newUtilization > 85) {
          status = 'WARNING';
          severity = 'MEDIUM';
          message = `High settlement capacity utilization: ${newUtilization.toFixed(1)}%`;
          recommendedAction = 'Monitor remaining capacity';
        }
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'SETTLEMENT_CAPACITY_CHECK',
        status,
        severity,
        message,
        details: capacity,
        recommendedAction,
        bypassable: status !== 'FAIL',
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'SETTLEMENT_CAPACITY_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkLiquidity(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const liquidityInfo = await this.getLiquidityInfo(order.securityId, order.quantity, order.side);
      
      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Liquidity check passed';
      let recommendedAction: string | undefined;

      switch (liquidityInfo.liquidityRisk) {
        case 'CRITICAL':
          status = 'FAIL';
          severity = 'HIGH';
          message = `Critical liquidity risk: ${liquidityInfo.liquidityScore}/100`;
          recommendedAction = 'Consider reducing order size or using algorithmic execution';
          break;
        case 'HIGH':
          status = 'WARNING';
          severity = 'MEDIUM';
          message = `High liquidity risk: ${liquidityInfo.liquidityScore}/100`;
          recommendedAction = 'Monitor market impact during execution';
          break;
        case 'MEDIUM':
          status = 'WARNING';
          severity = 'LOW';
          message = `Medium liquidity risk: ${liquidityInfo.liquidityScore}/100`;
          recommendedAction = 'Consider execution timing';
          break;
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'LIQUIDITY_CHECK',
        status,
        severity,
        message,
        details: liquidityInfo,
        actualValue: liquidityInfo.liquidityScore,
        threshold: 30, // Minimum acceptable liquidity score
        recommendedAction,
        bypassable: status !== 'FAIL',
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'LIQUIDITY_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkRegulatoryCompliance(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const regulatoryRules = Array.from(this.complianceRules.values())
        .filter(rule => rule.ruleType === 'REGULATORY' && rule.isActive);

      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Regulatory compliance check passed';
      let recommendedAction: string | undefined;
      const violations: string[] = [];

      for (const rule of regulatoryRules) {
        const violation = await this.evaluateComplianceRule(order, rule);
        if (violation) {
          violations.push(violation);
          
          switch (rule.violationAction) {
            case 'BLOCK':
              status = 'FAIL';
              severity = 'CRITICAL';
              message = `Regulatory violation: ${violation}`;
              recommendedAction = 'Obtain regulatory approval or cancel order';
              break;
            case 'REQUIRE_APPROVAL':
              if (status === 'PASS') status = 'WARNING';
              severity = 'HIGH';
              message = `Regulatory review required: ${violation}`;
              recommendedAction = 'Obtain compliance approval before execution';
              break;
            case 'WARN':
              if (status === 'PASS') status = 'WARNING';
              if (severity === 'INFO') severity = 'MEDIUM';
              message = `Regulatory warning: ${violation}`;
              recommendedAction = 'Review compliance implications';
              break;
          }
        }
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'REGULATORY_COMPLIANCE_CHECK',
        status,
        severity,
        message,
        details: { violations, rulesChecked: regulatoryRules.length },
        recommendedAction,
        bypassable: status !== 'FAIL' || severity === 'INFO',
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'REGULATORY_COMPLIANCE_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkInternalPolicies(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const internalRules = Array.from(this.complianceRules.values())
        .filter(rule => rule.ruleType === 'INTERNAL' && rule.isActive);

      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Internal policy check passed';
      let recommendedAction: string | undefined;
      const violations: string[] = [];

      for (const rule of internalRules) {
        const violation = await this.evaluateComplianceRule(order, rule);
        if (violation) {
          violations.push(violation);
          
          switch (rule.violationAction) {
            case 'BLOCK':
              status = 'FAIL';
              severity = 'HIGH';
              message = `Policy violation: ${violation}`;
              recommendedAction = 'Obtain management approval or cancel order';
              break;
            case 'REQUIRE_APPROVAL':
              if (status === 'PASS') status = 'WARNING';
              severity = 'MEDIUM';
              message = `Management approval required: ${violation}`;
              recommendedAction = 'Escalate to senior management';
              break;
            case 'WARN':
              if (status === 'PASS') status = 'WARNING';
              if (severity === 'INFO') severity = 'LOW';
              message = `Policy warning: ${violation}`;
              recommendedAction = 'Review policy compliance';
              break;
          }
        }
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'INTERNAL_POLICY_CHECK',
        status,
        severity,
        message,
        details: { violations, rulesChecked: internalRules.length },
        recommendedAction,
        bypassable: status !== 'FAIL',
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'INTERNAL_POLICY_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkMarketHours(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const marketHours = await this.getMarketHours(order.securityId);
      const currentTime = new Date();
      
      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Market hours check passed';
      let recommendedAction: string | undefined;

      if (!this.isMarketOpen(currentTime, marketHours)) {
        status = 'WARNING';
        severity = 'MEDIUM';
        message = 'Market is currently closed';
        recommendedAction = 'Order will be queued for next market open';
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'MARKET_HOURS_CHECK',
        status,
        severity,
        message,
        details: { marketHours, currentTime },
        recommendedAction,
        bypassable: true,
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'MARKET_HOURS_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkSettlementDate(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const businessDays = await this.getBusinessDaysBetween(new Date(), order.settlementDate);
      const standardSettlementDays = await this.getStandardSettlementDays(order.securityId);
      
      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Settlement date check passed';
      let recommendedAction: string | undefined;

      if (businessDays < standardSettlementDays) {
        status = 'WARNING';
        severity = 'MEDIUM';
        message = `Shortened settlement period: T+${businessDays} vs standard T+${standardSettlementDays}`;
        recommendedAction = 'Verify counterparty can settle early';
      } else if (businessDays > standardSettlementDays + 5) {
        status = 'WARNING';
        severity = 'LOW';
        message = `Extended settlement period: T+${businessDays}`;
        recommendedAction = 'Consider settlement risk implications';
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'SETTLEMENT_DATE_CHECK',
        status,
        severity,
        message,
        details: { businessDays, standardSettlementDays, settlementDate: order.settlementDate },
        recommendedAction,
        bypassable: true,
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'SETTLEMENT_DATE_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkPriceReasonableness(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const marketPrice = await this.getMarketPrice(order.securityId);
      const priceDeviation = Math.abs(order.price - marketPrice) / marketPrice * 100;
      
      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Price reasonableness check passed';
      let recommendedAction: string | undefined;

      if (priceDeviation > 20) {
        status = 'FAIL';
        severity = 'HIGH';
        message = `Price deviation too high: ${priceDeviation.toFixed(1)}% from market`;
        recommendedAction = 'Verify order price or obtain senior approval';
      } else if (priceDeviation > 10) {
        status = 'WARNING';
        severity = 'MEDIUM';
        message = `Significant price deviation: ${priceDeviation.toFixed(1)}% from market`;
        recommendedAction = 'Confirm order price accuracy';
      } else if (priceDeviation > 5) {
        status = 'WARNING';
        severity = 'LOW';
        message = `Moderate price deviation: ${priceDeviation.toFixed(1)}% from market`;
        recommendedAction = 'Monitor execution carefully';
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'PRICE_REASONABLENESS_CHECK',
        status,
        severity,
        message,
        details: { orderPrice: order.price, marketPrice, priceDeviation },
        actualValue: priceDeviation,
        threshold: 20,
        recommendedAction,
        bypassable: status !== 'FAIL',
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'PRICE_REASONABLENESS_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkCrossTrades(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const oppositeOrders = await this.findOppositeOrders(order);
      
      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Cross trade check passed';
      let recommendedAction: string | undefined;

      if (oppositeOrders.length > 0) {
        status = 'WARNING';
        severity = 'MEDIUM';
        message = `Potential cross trades identified: ${oppositeOrders.length} orders`;
        recommendedAction = 'Review for cross trade opportunities';
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'CROSS_TRADE_CHECK',
        status,
        severity,
        message,
        details: { oppositeOrders: oppositeOrders.length },
        recommendedAction,
        bypassable: true,
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'CROSS_TRADE_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkWashTrades(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const recentTrades = await this.getRecentTrades(order.portfolioId, order.securityId, 30); // Last 30 days
      const washTradeRisk = this.analyzeWashTradeRisk(order, recentTrades);
      
      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Wash trade check passed';
      let recommendedAction: string | undefined;

      if (washTradeRisk.riskLevel === 'HIGH') {
        status = 'FAIL';
        severity = 'CRITICAL';
        message = `High wash trade risk detected`;
        recommendedAction = 'Review trading pattern with compliance';
      } else if (washTradeRisk.riskLevel === 'MEDIUM') {
        status = 'WARNING';
        severity = 'MEDIUM';
        message = `Moderate wash trade risk detected`;
        recommendedAction = 'Document business rationale';
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'WASH_TRADE_CHECK',
        status,
        severity,
        message,
        details: washTradeRisk,
        recommendedAction,
        bypassable: status !== 'FAIL',
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'WASH_TRADE_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkRestrictedSecurities(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const restrictionInfo = await this.getSecurityRestrictions(order.securityId, order.portfolioId);
      
      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'Restricted securities check passed';
      let recommendedAction: string | undefined;

      if (restrictionInfo.isRestricted) {
        switch (restrictionInfo.restrictionType) {
          case 'BLOCKED':
            status = 'FAIL';
            severity = 'CRITICAL';
            message = `Security is blocked: ${restrictionInfo.reason}`;
            recommendedAction = 'Remove from restricted list or cancel order';
            break;
          case 'APPROVAL_REQUIRED':
            status = 'WARNING';
            severity = 'HIGH';
            message = `Security requires approval: ${restrictionInfo.reason}`;
            recommendedAction = 'Obtain compliance approval before execution';
            break;
          case 'WARNING':
            status = 'WARNING';
            severity = 'MEDIUM';
            message = `Security flagged: ${restrictionInfo.reason}`;
            recommendedAction = 'Review restriction details';
            break;
        }
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'RESTRICTED_SECURITY_CHECK',
        status,
        severity,
        message,
        details: restrictionInfo,
        recommendedAction,
        bypassable: status !== 'FAIL',
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'RESTRICTED_SECURITY_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private async checkKycAml(order: TradeOrder): Promise<RiskCheckResult> {
    const startTime = Date.now();
    
    try {
      const kycStatus = await this.getKycStatus(order.counterpartyId);
      const amlRisk = await this.getAmlRiskLevel(order.counterpartyId);
      
      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let severity: RiskCheckResult['severity'] = 'INFO';
      let message = 'KYC/AML check passed';
      let recommendedAction: string | undefined;

      if (kycStatus.status !== 'APPROVED') {
        status = 'FAIL';
        severity = 'CRITICAL';
        message = `KYC not approved: ${kycStatus.status}`;
        recommendedAction = 'Complete KYC process before trading';
      } else if (amlRisk.riskLevel === 'HIGH') {
        status = 'WARNING';
        severity = 'HIGH';
        message = `High AML risk counterparty`;
        recommendedAction = 'Enhanced due diligence required';
      } else if (amlRisk.riskLevel === 'MEDIUM') {
        status = 'WARNING';
        severity = 'MEDIUM';
        message = `Medium AML risk counterparty`;
        recommendedAction = 'Monitor transaction patterns';
      }

      return {
        checkId: uuidv4(),
        orderId: order.id,
        checkType: 'KYC_AML_CHECK',
        status,
        severity,
        message,
        details: { kycStatus, amlRisk },
        recommendedAction,
        bypassable: status !== 'FAIL',
        executedAt: new Date(),
        executionTimeMs: Date.now() - startTime
      };

    } catch (error: any) {
      return this.createErrorResult(order.id, 'KYC_AML_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  private createErrorResult(orderId: string, checkType: string, errorMessage: string, startTime: number): RiskCheckResult {
    return {
      checkId: uuidv4(),
      orderId,
      checkType,
      status: 'FAIL',
      severity: 'HIGH',
      message: `Check execution failed: ${errorMessage}`,
      bypassable: false,
      executedAt: new Date(),
      executionTimeMs: Date.now() - startTime
    };
  }

  // Mock implementations of data access methods (would be replaced with actual service calls)
  private getEntityLimits(entityId: string, limitType: string): RiskLimit[] {
    return this.riskLimits.get(`${entityId}_${limitType}`) || [];
  }

  private async getCurrentPosition(portfolioId: string, securityId: string): Promise<number> {
    // Mock implementation
    return Math.floor(Math.random() * 10000);
  }

  private async getCurrentCounterpartyExposure(counterpartyId: string): Promise<number> {
    // Mock implementation
    return Math.floor(Math.random() * 1000000);
  }

  private async getPortfolioValue(portfolioId: string): Promise<number> {
    // Mock implementation
    return Math.floor(Math.random() * 100000000) + 10000000;
  }

  private async getCurrentSecurityValue(portfolioId: string, securityId: string): Promise<number> {
    // Mock implementation
    return Math.floor(Math.random() * 5000000);
  }

  private async getCurrentCreditExposure(counterpartyId: string): Promise<number> {
    // Mock implementation
    return Math.floor(Math.random() * 2000000);
  }

  private async calculateOrderCreditRisk(order: TradeOrder): Promise<number> {
    // Mock implementation - simplified credit risk calculation
    return order.quantity * order.price * 0.1; // 10% of notional
  }

  private async getSettlementCapacity(counterpartyId: string, securityId: string): Promise<SettlementCapacity | null> {
    // Mock implementation
    return {
      counterpartyId,
      securityType: 'EQUITY',
      currency: 'USD',
      maxDailyVolume: 1000000,
      maxDailyNotional: 50000000,
      currentDailyVolume: 750000,
      currentDailyNotional: 35000000,
      availableCapacity: 15000000,
      utilizationPercentage: 70,
      lastUpdated: new Date()
    };
  }

  private async getLiquidityInfo(securityId: string, quantity: number, side: 'BUY' | 'SELL'): Promise<LiquidityCheck> {
    // Mock implementation
    const availableLiquidity = Math.floor(Math.random() * 1000000) + 100000;
    const liquidityRatio = Math.min(quantity / availableLiquidity, 1.0);
    
    let liquidityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    let liquidityScore: number;
    
    if (liquidityRatio > 0.5) {
      liquidityRisk = 'CRITICAL';
      liquidityScore = 20;
    } else if (liquidityRatio > 0.3) {
      liquidityRisk = 'HIGH';
      liquidityScore = 40;
    } else if (liquidityRatio > 0.1) {
      liquidityRisk = 'MEDIUM';
      liquidityScore = 60;
    } else {
      liquidityRisk = 'LOW';
      liquidityScore = 80;
    }

    return {
      securityId,
      requiredQuantity: quantity,
      side,
      availableLiquidity,
      liquidityRatio,
      averageDailyVolume: availableLiquidity * 2,
      marketImpact: liquidityRatio * 100,
      liquidityScore,
      liquidityRisk
    };
  }

  private async evaluateComplianceRule(order: TradeOrder, rule: ComplianceRule): Promise<string | null> {
    // Mock implementation - would parse and evaluate rule logic
    // For now, randomly return violations for demonstration
    if (Math.random() < 0.1) { // 10% chance of violation
      return `Rule violation: ${rule.ruleName}`;
    }
    return null;
  }

  private async getMarketHours(securityId: string): Promise<{ open: string; close: string; timezone: string }> {
    // Mock implementation
    return { open: '09:30', close: '16:00', timezone: 'EST' };
  }

  private isMarketOpen(currentTime: Date, marketHours: { open: string; close: string }): boolean {
    // Simplified market hours check
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const currentMinutes = hour * 60 + minute;
    
    const [openHour, openMinute] = marketHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = marketHours.close.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;
    
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  private async getBusinessDaysBetween(startDate: Date, endDate: Date): Promise<number> {
    // Mock implementation
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(1, daysDiff); // At least 1 business day
  }

  private async getStandardSettlementDays(securityId: string): Promise<number> {
    // Mock implementation - would lookup security type and return standard settlement
    return 2; // T+2 for equities
  }

  private async getMarketPrice(securityId: string): Promise<number> {
    // Mock implementation
    return Math.random() * 1000 + 10;
  }

  private async findOppositeOrders(order: TradeOrder): Promise<any[]> {
    // Mock implementation
    return [];
  }

  private async getRecentTrades(portfolioId: string, securityId: string, days: number): Promise<any[]> {
    // Mock implementation
    return [];
  }

  private analyzeWashTradeRisk(order: TradeOrder, recentTrades: any[]): { riskLevel: string; details: any } {
    // Mock implementation
    return { riskLevel: 'LOW', details: {} };
  }

  private async getSecurityRestrictions(securityId: string, portfolioId: string): Promise<{
    isRestricted: boolean;
    restrictionType?: string;
    reason?: string;
  }> {
    // Mock implementation
    return { isRestricted: false };
  }

  private async getKycStatus(counterpartyId: string): Promise<{ status: string; lastUpdated: Date }> {
    // Mock implementation
    return { status: 'APPROVED', lastUpdated: new Date() };
  }

  private async getAmlRiskLevel(counterpartyId: string): Promise<{ riskLevel: string; score: number }> {
    // Mock implementation
    return { riskLevel: 'LOW', score: 25 };
  }

  // Public management methods
  public addRiskLimit(entityId: string, limit: Omit<RiskLimit, 'id' | 'createdAt' | 'updatedAt'>): RiskLimit {
    const riskLimit: RiskLimit = {
      ...limit,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const key = `${entityId}_${limit.limitType}`;
    const limits = this.riskLimits.get(key) || [];
    limits.push(riskLimit);
    this.riskLimits.set(key, limits);

    this.emit('riskLimitAdded', riskLimit);
    return riskLimit;
  }

  public addComplianceRule(rule: Omit<ComplianceRule, 'id' | 'createdAt' | 'updatedAt'>): ComplianceRule {
    const complianceRule: ComplianceRule = {
      ...rule,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.complianceRules.set(complianceRule.id, complianceRule);
    this.emit('complianceRuleAdded', complianceRule);
    return complianceRule;
  }

  public bypassRiskCheck(suiteId: string, checkId: string, bypassReason: string, bypassedBy: string): boolean {
    for (const history of this.riskCheckHistory.values()) {
      const suite = history.find(s => s.suiteId === suiteId);
      if (suite) {
        const result = suite.results.find(r => r.checkId === checkId);
        if (result && result.bypassable) {
          result.bypassReason = bypassReason;
          result.bypassedBy = bypassedBy;
          
          // Recalculate suite status
          suite.overallStatus = this.determineOverallStatus(suite.results);
          suite.canProceed = this.canTradeProceed(suite.results);
          
          this.emit('riskCheckBypassed', { suiteId, checkId, bypassReason, bypassedBy });
          return true;
        }
      }
    }
    return false;
  }

  // Getter methods
  public getRiskCheckHistory(orderId: string): RiskCheckSuite[] {
    return this.riskCheckHistory.get(orderId) || [];
  }

  public getLatestRiskCheck(orderId: string): RiskCheckSuite | undefined {
    const history = this.riskCheckHistory.get(orderId) || [];
    return history[history.length - 1];
  }

  public getAllActiveAlerts(): RiskCheckResult[] {
    const alerts: RiskCheckResult[] = [];
    
    this.riskCheckHistory.forEach(history => {
      const latestSuite = history[history.length - 1];
      if (latestSuite) {
        const alertResults = latestSuite.results.filter(r => 
          (r.status === 'FAIL' || r.status === 'WARNING') && 
          (r.severity === 'HIGH' || r.severity === 'CRITICAL')
        );
        alerts.push(...alertResults);
      }
    });

    return alerts.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
  }

  public generateRiskSummary(timeFrame: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY'): {
    totalChecksExecuted: number;
    passRate: number;
    failRate: number;
    warningRate: number;
    mostCommonFailures: { checkType: string; count: number }[];
    averageExecutionTime: number;
  } {
    const cutoff = new Date();
    switch (timeFrame) {
      case 'DAILY':
        cutoff.setDate(cutoff.getDate() - 1);
        break;
      case 'WEEKLY':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'MONTHLY':
        cutoff.setDate(cutoff.getDate() - 30);
        break;
    }

    const allResults: RiskCheckResult[] = [];
    this.riskCheckHistory.forEach(history => {
      history.forEach(suite => {
        if (suite.executedAt >= cutoff) {
          allResults.push(...suite.results);
        }
      });
    });

    const totalChecks = allResults.length;
    const passed = allResults.filter(r => r.status === 'PASS').length;
    const failed = allResults.filter(r => r.status === 'FAIL').length;
    const warnings = allResults.filter(r => r.status === 'WARNING').length;

    // Count failures by check type
    const failureCounts = new Map<string, number>();
    allResults.filter(r => r.status === 'FAIL').forEach(r => {
      failureCounts.set(r.checkType, (failureCounts.get(r.checkType) || 0) + 1);
    });

    const mostCommonFailures = Array.from(failureCounts.entries())
      .map(([checkType, count]) => ({ checkType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalExecutionTime = allResults.reduce((sum, r) => sum + r.executionTimeMs, 0);
    const averageExecutionTime = totalChecks > 0 ? totalExecutionTime / totalChecks : 0;

    return {
      totalChecksExecuted: totalChecks,
      passRate: totalChecks > 0 ? (passed / totalChecks) * 100 : 0,
      failRate: totalChecks > 0 ? (failed / totalChecks) * 100 : 0,
      warningRate: totalChecks > 0 ? (warnings / totalChecks) * 100 : 0,
      mostCommonFailures,
      averageExecutionTime
    };
  }
}

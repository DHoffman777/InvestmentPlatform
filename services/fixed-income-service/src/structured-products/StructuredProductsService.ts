import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export interface MortgageBackedSecurity {
  id: string;
  cusip: string;
  name: string;
  issuer: string;
  type: 'gnma' | 'fnma' | 'fhlmc' | 'private_label' | 'commercial';
  originalBalance: number;
  currentBalance: number;
  couponRate: number;
  maturityDate: Date;
  issueDate: Date;
  pricingDate: Date;
  price: number;
  yield: number;
  duration: number;
  convexity: number;
  averageLife: number;
  poolNumber?: string;
  passThrough: boolean;
  collateral: MBSCollateral;
  prepaymentModel: PrepaymentModel;
  cashFlows: CashFlow[];
  riskMetrics: MBSRiskMetrics;
  servicingData: ServicingData;
  active: boolean;
}

export interface MBSCollateral {
  originalLoanBalance: number;
  weightedAverageCoupon: number;
  weightedAverageMaturity: number;
  weightedAverageLoanAge: number;
  loanCount: number;
  geography: GeographicDistribution;
  creditQuality: CreditQuality;
  loanPurpose: { [purpose: string]: number };
  propertyType: { [type: string]: number };
}

export interface AssetBackedSecurity {
  id: string;
  cusip: string;
  name: string;
  issuer: string;
  assetType: 'auto_loans' | 'credit_cards' | 'student_loans' | 'equipment' | 'receivables' | 'other';
  tranche: string;
  seniority: 'senior' | 'mezzanine' | 'subordinate' | 'equity';
  originalBalance: number;
  currentBalance: number;
  couponRate: number;
  couponType: 'fixed' | 'floating' | 'step_up';
  maturityDate: Date;
  issueDate: Date;
  price: number;
  yield: number;
  duration: number;
  creditRating: CreditRating;
  enhancement: CreditEnhancement;
  collateral: ABSCollateral;
  cashFlows: CashFlow[];
  paymentStructure: ABSPaymentStructure;
  riskMetrics: ABSRiskMetrics;
  active: boolean;
}

export interface CallableBond {
  id: string;
  cusip: string;
  name: string;
  issuer: string;
  type: 'corporate' | 'municipal' | 'government' | 'agency';
  originalAmount: number;
  outstandingAmount: number;
  couponRate: number;
  maturityDate: Date;
  issueDate: Date;
  firstCallDate: Date;
  callSchedule: CallOption[];
  callProtection: CallProtection;
  price: number;
  yield: number;
  yieldToCall: number;
  yieldToWorst: number;
  duration: number;
  modifiedDuration: number;
  convexity: number;
  optionAdjustedSpread: number;
  creditRating: CreditRating;
  callRisk: CallRisk;
  cashFlows: CashFlow[];
  active: boolean;
}

export interface CallOption {
  callDate: Date;
  callPrice: number;
  callType: 'make_whole' | 'fixed_price' | 'declining_premium' | 'par';
  noticePeriod: number; // days
  exercisable: boolean;
}

export interface CallProtection {
  type: 'hard' | 'soft' | 'none';
  endDate?: Date;
  premium?: number;
  conditions?: string[];
}

export interface CashFlow {
  date: Date;
  principal: number;
  interest: number;
  total: number;
  balanceRemaining: number;
  type: 'scheduled' | 'prepayment' | 'default' | 'call' | 'maturity';
  probability: number;
}

export interface PrepaymentModel {
  type: 'psa' | 'cpr' | 'smm' | 'custom';
  speed: number; // PSA percentage or CPR percentage
  assumptions: {
    baselineSpeed: number;
    seasonality: number[];
    burnout: number;
    incentive: IncentiveFunction;
  };
  scenario: 'base' | 'fast' | 'slow';
}

export interface IncentiveFunction {
  refinancingThreshold: number;
  maxIncentive: number;
  turnoverRate: number;
}

export interface MBSRiskMetrics {
  prepaymentRisk: number;
  extensionRisk: number;
  creditRisk: number;
  interestRateRisk: number;
  liquidityRisk: number;
  modelRisk: number;
  keyRateDurations: { [tenor: string]: number };
  scenarioAnalysis: ScenarioResult[];
}

export interface ABSRiskMetrics {
  creditRisk: number;
  prepaymentRisk: number;
  liquidityRisk: number;
  concentrationRisk: number;
  servicerRisk: number;
  keyRateDurations: { [tenor: string]: number };
  stressTestResults: StressTestResult[];
}

export interface CallRisk {
  callProbability: { [date: string]: number };
  reinvestmentRisk: number;
  negativeCash flows: number;
  optionValue: number; // value of embedded call option
}

export interface GeographicDistribution {
  states: { [state: string]: number };
  msas: { [msa: string]: number };
  concentration: number; // Gini coefficient
}

export interface CreditQuality {
  averageFICO: number;
  ficoDistribution: { [range: string]: number };
  loanToValue: number;
  ltvDistribution: { [range: string]: number };
  delinquencyRate: number;
  defaultRate: number;
}

export interface CreditRating {
  agency: string;
  rating: string;
  outlook: 'positive' | 'stable' | 'negative' | 'developing';
  lastReview: Date;
  watchList: boolean;
}

export interface CreditEnhancement {
  type: 'subordination' | 'excess_spread' | 'reserve_fund' | 'insurance' | 'letter_of_credit';
  level: number;
  provider?: string;
  trigger?: number;
}

export interface ABSCollateral {
  assetCount: number;
  averageBalance: number;
  weightedAverageCoupon: number;
  weightedAverageLife: number;
  geography: GeographicDistribution;
  creditQuality: CreditQuality;
  diversification: DiversificationMetrics;
}

export interface ABSPaymentStructure {
  priority: 'sequential' | 'pro_rata' | 'turbo';
  paymentFrequency: 'monthly' | 'quarterly' | 'semi_annual';
  principalPayment: 'bullet' | 'amortizing' | 'controlled_amortization';
  interestPayment: 'current' | 'accrual' | 'pay_in_kind';
  triggers: PaymentTrigger[];
}

export interface PaymentTrigger {
  type: 'step_down' | 'rapid_amortization' | 'cash_trap' | 'turbo';
  threshold: number;
  metric: string;
  action: string;
  active: boolean;
}

export interface DiversificationMetrics {
  herfindahlIndex: number;
  concentration: { [category: string]: number };
  correlations: { [asset: string]: number };
}

export interface ServicingData {
  servicer: string;
  servicingFee: number;
  delinquencyRate: number;
  lossRate: number;
  recoveryRate: number;
  servicingAdvances: number;
  lastReportingDate: Date;
}

export interface ScenarioResult {
  scenario: string;
  yieldChange: number;
  prepaymentSpeed: number;
  averageLife: number;
  duration: number;
  totalReturn: number;
}

export interface StressTestResult {
  scenario: string;
  expectedLoss: number;
  unexpectedLoss: number;
  riskContribution: number;
  capitalRequirement: number;
}

/**
 * Structured Products Service
 * Handles mortgage-backed securities, asset-backed securities, and callable bonds
 */
export class StructuredProductsService extends EventEmitter {
  private mbsSecurities: Map<string, MortgageBackedSecurity> = new Map();
  private absSecurities: Map<string, AssetBackedSecurity> = new Map();
  private callableBonds: Map<string, CallableBond> = new Map();
  private marketData: Map<string, any> = new Map();

  constructor() {
    super();
    this.initializeMarketData();
    this.startPricingEngine();
  }

  /**
   * Create mortgage-backed security
   */
  public async createMBS(
    mbsData: Omit<MortgageBackedSecurity, 'id' | 'cashFlows' | 'riskMetrics' | 'active'>
  ): Promise<MortgageBackedSecurity> {
    try {
      const mbsId = randomUUID();
      
      // Generate cash flows using prepayment model
      const cashFlows = await this.generateMBSCashFlows(mbsData);
      
      // Calculate risk metrics
      const riskMetrics = await this.calculateMBSRiskMetrics(mbsData, cashFlows);

      const mbs: MortgageBackedSecurity = {
        ...mbsData,
        id: mbsId,
        cashFlows,
        riskMetrics,
        active: true
      };

      this.mbsSecurities.set(mbsId, mbs);

      this.emit('mbsCreated', {
        mbsId,
        cusip: mbs.cusip,
        type: mbs.type,
        originalBalance: mbs.originalBalance,
        couponRate: mbs.couponRate,
        timestamp: new Date()
      });

      return mbs;

    } catch (error) {
      this.emit('mbsError', {
        operation: 'create',
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Create asset-backed security
   */
  public async createABS(
    absData: Omit<AssetBackedSecurity, 'id' | 'cashFlows' | 'riskMetrics' | 'active'>
  ): Promise<AssetBackedSecurity> {
    try {
      const absId = randomUUID();
      
      // Generate cash flows based on collateral performance
      const cashFlows = await this.generateABSCashFlows(absData);
      
      // Calculate risk metrics
      const riskMetrics = await this.calculateABSRiskMetrics(absData, cashFlows);

      const abs: AssetBackedSecurity = {
        ...absData,
        id: absId,
        cashFlows,
        riskMetrics,
        active: true
      };

      this.absSecurities.set(absId, abs);

      this.emit('absCreated', {
        absId,
        cusip: abs.cusip,
        assetType: abs.assetType,
        tranche: abs.tranche,
        seniority: abs.seniority,
        timestamp: new Date()
      });

      return abs;

    } catch (error) {
      this.emit('absError', {
        operation: 'create',
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Create callable bond
   */
  public async createCallableBond(
    bondData: Omit<CallableBond, 'id' | 'yieldToCall' | 'yieldToWorst' | 'callRisk' | 'cashFlows' | 'active'>
  ): Promise<CallableBond> {
    try {
      const bondId = randomUUID();
      
      // Calculate call-adjusted metrics
      const yieldToCall = this.calculateYieldToCall(bondData);
      const yieldToWorst = Math.min(bondData.yield, yieldToCall);
      
      // Generate cash flows considering call scenarios
      const cashFlows = await this.generateCallableBondCashFlows(bondData);
      
      // Calculate call risk metrics
      const callRisk = await this.calculateCallRisk(bondData, cashFlows);

      const bond: CallableBond = {
        ...bondData,
        id: bondId,
        yieldToCall,
        yieldToWorst,
        callRisk,
        cashFlows,
        active: true
      };

      this.callableBonds.set(bondId, bond);

      this.emit('callableBondCreated', {
        bondId,
        cusip: bond.cusip,
        type: bond.type,
        issuer: bond.issuer,
        firstCallDate: bond.firstCallDate,
        timestamp: new Date()
      });

      return bond;

    } catch (error) {
      this.emit('callableBondError', {
        operation: 'create',
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Update MBS prepayment speeds and recalculate metrics
   */
  public async updateMBSPrepaymentModel(
    mbsId: string,
    newModel: PrepaymentModel
  ): Promise<MortgageBackedSecurity> {
    try {
      const mbs = this.mbsSecurities.get(mbsId);
      if (!mbs) {
        throw new Error('MBS not found');
      }

      mbs.prepaymentModel = newModel;
      
      // Regenerate cash flows with new prepayment assumptions
      mbs.cashFlows = await this.generateMBSCashFlows(mbs);
      
      // Recalculate risk metrics
      mbs.riskMetrics = await this.calculateMBSRiskMetrics(mbs, mbs.cashFlows);

      this.mbsSecurities.set(mbsId, mbs);

      this.emit('mbsPrepaymentModelUpdated', {
        mbsId,
        cusip: mbs.cusip,
        newSpeed: newModel.speed,
        scenario: newModel.scenario,
        timestamp: new Date()
      });

      return mbs;

    } catch (error) {
      this.emit('mbsError', {
        mbsId,
        operation: 'update_prepayment',
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Analyze call option exercise probability
   */
  public analyzeCallProbability(bondId: string, marketScenarios: any[]): {
    callProbabilities: { [date: string]: number };
    expectedCallDate: Date | null;
    optionValue: number;
    recommendations: string[];
  } {
    try {
      const bond = this.callableBonds.get(bondId);
      if (!bond) {
        throw new Error('Callable bond not found');
      }

      const callProbabilities: { [date: string]: number } = {};
      let totalCallProbability = 0;
      let weightedCallDate = 0;

      for (const callOption of bond.callSchedule) {
        if (callOption.exercisable && callOption.callDate > new Date()) {
          // Calculate probability based on interest rate scenarios
          let exerciseProbability = 0;
          
          for (const scenario of marketScenarios) {
            const currentYield = scenario.yieldCurve[this.getMaturityBucket(bond.maturityDate)];
            const refinancingRate = currentYield + 0.5; // 50 bps spread assumption
            
            if (refinancingRate < bond.couponRate - 1.0) { // 100 bps threshold
              exerciseProbability += scenario.probability * 0.8; // 80% exercise probability
            } else if (refinancingRate < bond.couponRate - 0.5) {
              exerciseProbability += scenario.probability * 0.4; // 40% exercise probability
            }
          }

          callProbabilities[callOption.callDate.toISOString()] = exerciseProbability;
          totalCallProbability += exerciseProbability;
          weightedCallDate += exerciseProbability * callOption.callDate.getTime();
        }
      }

      const expectedCallDate = totalCallProbability > 0 
        ? new Date(weightedCallDate / totalCallProbability) 
        : null;

      // Calculate option value using Black-Scholes approximation
      const optionValue = this.calculateCallOptionValue(bond, marketScenarios);

      // Generate recommendations
      const recommendations = this.generateCallAnalysisRecommendations(
        bond, callProbabilities, expectedCallDate, optionValue
      );

      return {
        callProbabilities,
        expectedCallDate,
        optionValue,
        recommendations
      };

    } catch (error) {
      this.emit('callAnalysisError', {
        bondId,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Run stress tests on structured products
   */
  public async runStressTests(
    productIds: string[],
    scenarios: StressScenario[]
  ): Promise<Map<string, StressTestResult[]>> {
    const results = new Map<string, StressTestResult[]>();

    for (const productId of productIds) {
      const productResults: StressTestResult[] = [];

      for (const scenario of scenarios) {
        let result: StressTestResult;

        if (this.mbsSecurities.has(productId)) {
          result = await this.stressMBS(this.mbsSecurities.get(productId)!, scenario);
        } else if (this.absSecurities.has(productId)) {
          result = await this.stressABS(this.absSecurities.get(productId)!, scenario);
        } else if (this.callableBonds.has(productId)) {
          result = await this.stressCallableBond(this.callableBonds.get(productId)!, scenario);
        } else {
          continue;
        }

        productResults.push(result);
      }

      results.set(productId, productResults);
    }

    this.emit('stressTestCompleted', {
      productCount: productIds.length,
      scenarioCount: scenarios.length,
      timestamp: new Date()
    });

    return results;
  }

  // Private helper methods

  private async generateMBSCashFlows(mbs: MortgageBackedSecurity): Promise<CashFlow[]> {
    const cashFlows: CashFlow[] = [];
    let remainingBalance = mbs.currentBalance;
    const monthlyRate = mbs.couponRate / 12;
    
    // Calculate payment schedule based on prepayment model
    for (let month = 1; month <= 360; month++) { // 30-year maximum
      if (remainingBalance <= 0) break;

      const scheduledPrincipal = this.calculateScheduledPrincipal(remainingBalance, monthlyRate, 360 - month + 1);
      const interestPayment = remainingBalance * monthlyRate;
      
      // Apply prepayment model
      const prepaymentRate = this.calculatePrepaymentRate(mbs.prepaymentModel, month);
      const prepayment = (remainingBalance - scheduledPrincipal) * prepaymentRate;
      
      const totalPrincipal = scheduledPrincipal + prepayment;
      const totalPayment = totalPrincipal + interestPayment;
      
      remainingBalance -= totalPrincipal;

      const paymentDate = new Date(mbs.issueDate);
      paymentDate.setMonth(paymentDate.getMonth() + month);

      cashFlows.push({
        date: paymentDate,
        principal: totalPrincipal,
        interest: interestPayment,
        total: totalPayment,
        balanceRemaining: remainingBalance,
        type: prepayment > 0 ? 'prepayment' : 'scheduled',
        probability: 1.0
      });
    }

    return cashFlows;
  }

  private async generateABSCashFlows(abs: AssetBackedSecurity): Promise<CashFlow[]> {
    const cashFlows: CashFlow[] = [];
    let remainingBalance = abs.currentBalance;
    const paymentFrequency = abs.paymentStructure.paymentFrequency === 'monthly' ? 12 : 
                            abs.paymentStructure.paymentFrequency === 'quarterly' ? 4 : 2;
    
    const periodicRate = abs.couponRate / paymentFrequency;
    const totalPeriods = this.calculateABSMaturityPeriods(abs);
    
    for (let period = 1; period <= totalPeriods; period++) {
      if (remainingBalance <= 0) break;

      const interestPayment = remainingBalance * periodicRate;
      let principalPayment = 0;

      // Calculate principal payment based on structure
      switch (abs.paymentStructure.principalPayment) {
        case 'bullet':
          principalPayment = period === totalPeriods ? remainingBalance : 0;
          break;
        case 'amortizing':
          principalPayment = this.calculateABSAmortization(abs, remainingBalance, period, totalPeriods);
          break;
        case 'controlled_amortization':
          principalPayment = this.calculateControlledAmortization(abs, remainingBalance, period);
          break;
      }

      // Apply defaults and losses
      const defaultRate = this.getABSDefaultRate(abs, period);
      const recovery = defaultRate * abs.collateral.creditQuality.defaultRate * 0.7; // 70% recovery
      const netPrincipal = principalPayment - (principalPayment * defaultRate) + recovery;

      remainingBalance -= netPrincipal;

      const paymentDate = new Date(abs.issueDate);
      paymentDate.setMonth(paymentDate.getMonth() + (period * (12 / paymentFrequency)));

      cashFlows.push({
        date: paymentDate,
        principal: netPrincipal,
        interest: interestPayment,
        total: netPrincipal + interestPayment,
        balanceRemaining: remainingBalance,
        type: 'scheduled',
        probability: 1.0 - defaultRate
      });
    }

    return cashFlows;
  }

  private async generateCallableBondCashFlows(bond: CallableBond): Promise<CashFlow[]> {
    const cashFlows: CashFlow[] = [];
    const periodicRate = bond.couponRate / 2; // Assume semi-annual
    const totalPeriods = Math.ceil((bond.maturityDate.getTime() - bond.issueDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000 / 2));
    
    for (let period = 1; period <= totalPeriods; period++) {
      const paymentDate = new Date(bond.issueDate);
      paymentDate.setMonth(paymentDate.getMonth() + (period * 6));

      const interestPayment = bond.outstandingAmount * periodicRate;
      let principalPayment = 0;
      let probability = 1.0;

      // Check if this is a call date
      const callOption = bond.callSchedule.find(call => 
        Math.abs(call.callDate.getTime() - paymentDate.getTime()) < 24 * 60 * 60 * 1000
      );

      if (callOption && callOption.exercisable) {
        // Calculate call probability based on current market conditions
        const callProb = this.estimateCallProbability(bond, callOption, paymentDate);
        
        if (callProb > 0.5) {
          principalPayment = bond.outstandingAmount;
          probability = callProb;
        }
      }

      // Final maturity payment
      if (period === totalPeriods && principalPayment === 0) {
        principalPayment = bond.outstandingAmount;
      }

      cashFlows.push({
        date: paymentDate,
        principal: principalPayment,
        interest: interestPayment,
        total: principalPayment + interestPayment,
        balanceRemaining: principalPayment > 0 ? 0 : bond.outstandingAmount,
        type: principalPayment > 0 && period < totalPeriods ? 'call' : 'scheduled',
        probability
      });

      // If called, no more cash flows
      if (principalPayment > 0 && period < totalPeriods) {
        break;
      }
    }

    return cashFlows;
  }

  private async calculateMBSRiskMetrics(
    mbs: MortgageBackedSecurity,
    cashFlows: CashFlow[]
  ): Promise<MBSRiskMetrics> {
    // Calculate various risk metrics
    const prepaymentRisk = this.calculatePrepaymentRisk(mbs, cashFlows);
    const extensionRisk = this.calculateExtensionRisk(mbs, cashFlows);
    const creditRisk = mbs.collateral.creditQuality.defaultRate * 10; // Scale to 0-100
    const interestRateRisk = mbs.duration * 0.5; // Approximation
    const liquidityRisk = this.calculateLiquidityRisk(mbs.type);
    const modelRisk = this.calculateModelRisk(mbs.prepaymentModel);

    // Key rate durations (simplified)
    const keyRateDurations = {
      '2Y': mbs.duration * 0.1,
      '5Y': mbs.duration * 0.3,
      '10Y': mbs.duration * 0.4,
      '30Y': mbs.duration * 0.2
    };

    // Scenario analysis
    const scenarios = ['base', 'rates_up_100', 'rates_down_100', 'fast_prepay', 'slow_prepay'];
    const scenarioAnalysis: ScenarioResult[] = [];

    for (const scenario of scenarios) {
      scenarioAnalysis.push(await this.runMBSScenario(mbs, scenario));
    }

    return {
      prepaymentRisk,
      extensionRisk,
      creditRisk,
      interestRateRisk,
      liquidityRisk,
      modelRisk,
      keyRateDurations,
      scenarioAnalysis
    };
  }

  private async calculateABSRiskMetrics(
    abs: AssetBackedSecurity,
    cashFlows: CashFlow[]
  ): Promise<ABSRiskMetrics> {
    const creditRisk = abs.collateral.creditQuality.defaultRate * 15; // Scaled
    const prepaymentRisk = this.calculateABSPrepaymentRisk(abs);
    const liquidityRisk = this.calculateLiquidityRisk(abs.assetType);
    const concentrationRisk = abs.collateral.diversification.herfindahlIndex * 100;
    const servicerRisk = this.calculateServicerRisk(abs);

    const keyRateDurations = {
      '2Y': abs.duration * 0.2,
      '5Y': abs.duration * 0.5,
      '10Y': abs.duration * 0.3
    };

    const stressScenarios = ['base', 'recession', 'rate_shock', 'credit_stress'];
    const stressTestResults: StressTestResult[] = [];

    for (const scenario of stressScenarios) {
      stressTestResults.push(await this.stressABS(abs, { name: scenario } as StressScenario));
    }

    return {
      creditRisk,
      prepaymentRisk,
      liquidityRisk,
      concentrationRisk,
      servicerRisk,
      keyRateDurations,
      stressTestResults
    };
  }

  private calculateYieldToCall(bond: CallableBond): number {
    if (bond.callSchedule.length === 0) return bond.yield;

    // Find the next call date
    const nextCall = bond.callSchedule
      .filter(call => call.callDate > new Date() && call.exercisable)
      .sort((a, b) => a.callDate.getTime() - b.callDate.getTime())[0];

    if (!nextCall) return bond.yield;

    // Calculate yield to call using approximation
    const yearsToCall = (nextCall.callDate.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
    const annualCoupon = bond.couponRate * bond.outstandingAmount;
    const capitalGain = nextCall.callPrice - bond.price;

    return (annualCoupon + (capitalGain / yearsToCall)) / bond.price;
  }

  private async calculateCallRisk(bond: CallableBond, cashFlows: CashFlow[]): Promise<CallRisk> {
    const callProbabilities: { [date: string]: number } = {};
    
    for (const callOption of bond.callSchedule) {
      if (callOption.exercisable && callOption.callDate > new Date()) {
        const probability = this.estimateCallProbability(bond, callOption, callOption.callDate);
        callProbabilities[callOption.callDate.toISOString()] = probability;
      }
    }

    const reinvestmentRisk = this.calculateReinvestmentRisk(bond);
    const negativeConvexity = this.calculateNegativeConvexity(bond);
    const optionValue = this.calculateCallOptionValue(bond, []);

    return {
      callProbability: callProbabilities,
      reinvestmentRisk,
      negativeCashflows: negativeConvexity,
      optionValue
    };
  }

  // Additional helper methods for calculations...

  private calculateScheduledPrincipal(balance: number, rate: number, periods: number): number {
    if (rate === 0) return balance / periods;
    const payment = balance * (rate * Math.pow(1 + rate, periods)) / (Math.pow(1 + rate, periods) - 1);
    return payment - (balance * rate);
  }

  private calculatePrepaymentRate(model: PrepaymentModel, month: number): number {
    let baseSpeed = model.speed / 100;
    
    if (model.type === 'psa') {
      // PSA ramp: 0.2% in month 1, increasing by 0.2% per month until 6% in month 30
      if (month <= 30) {
        baseSpeed = (month * 0.002) * (model.speed / 100);
      } else {
        baseSpeed = 0.06 * (model.speed / 100);
      }
    }

    // Apply seasonality
    const seasonality = model.assumptions.seasonality[month % 12] || 1.0;
    
    // Apply burnout
    const burnout = Math.max(0, 1 - (month / 360) * model.assumptions.burnout);
    
    return baseSpeed * seasonality * burnout;
  }

  private calculatePrepaymentRisk(mbs: MortgageBackedSecurity, cashFlows: CashFlow[]): number {
    const varianceInTiming = this.calculateCashFlowVariance(cashFlows);
    return Math.min(100, varianceInTiming * 10);
  }

  private calculateExtensionRisk(mbs: MortgageBackedSecurity, cashFlows: CashFlow[]): number {
    const averageLife = this.calculateAverageLife(cashFlows);
    const maturityYears = (mbs.maturityDate.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
    return Math.min(100, (averageLife / maturityYears) * 50);
  }

  private calculateLiquidityRisk(securityType: string): number {
    const liquidityScores = {
      'gnma': 10,
      'fnma': 15,
      'fhlmc': 15,
      'private_label': 40,
      'auto_loans': 25,
      'credit_cards': 20,
      'student_loans': 35,
      'corporate': 20,
      'municipal': 30
    };
    return liquidityScores[securityType] || 50;
  }

  private calculateModelRisk(model: PrepaymentModel): number {
    const modelRiskScores = {
      'psa': 20,
      'cpr': 25,
      'smm': 30,
      'custom': 40
    };
    return modelRiskScores[model.type] || 35;
  }

  private async runMBSScenario(mbs: MortgageBackedSecurity, scenario: string): Promise<ScenarioResult> {
    // Simplified scenario analysis
    let yieldChange = 0;
    let prepaymentMultiplier = 1;

    switch (scenario) {
      case 'rates_up_100':
        yieldChange = 1.0;
        prepaymentMultiplier = 0.5;
        break;
      case 'rates_down_100':
        yieldChange = -1.0;
        prepaymentMultiplier = 2.0;
        break;
      case 'fast_prepay':
        prepaymentMultiplier = 3.0;
        break;
      case 'slow_prepay':
        prepaymentMultiplier = 0.3;
        break;
    }

    const newDuration = mbs.duration * (1 - yieldChange * 0.1);
    const newAverageLife = mbs.averageLife / prepaymentMultiplier;
    const totalReturn = -mbs.duration * yieldChange + (mbs.couponRate / 100);

    return {
      scenario,
      yieldChange,
      prepaymentSpeed: mbs.prepaymentModel.speed * prepaymentMultiplier,
      averageLife: newAverageLife,
      duration: newDuration,
      totalReturn
    };
  }

  private calculateABSMaturityPeriods(abs: AssetBackedSecurity): number {
    const years = (abs.maturityDate.getTime() - abs.issueDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const frequency = abs.paymentStructure.paymentFrequency === 'monthly' ? 12 :
                     abs.paymentStructure.paymentFrequency === 'quarterly' ? 4 : 2;
    return Math.ceil(years * frequency);
  }

  private calculateABSAmortization(abs: AssetBackedSecurity, balance: number, period: number, totalPeriods: number): number {
    // Simplified amortization calculation
    return balance / (totalPeriods - period + 1);
  }

  private calculateControlledAmortization(abs: AssetBackedSecurity, balance: number, period: number): number {
    // Controlled amortization based on collateral performance
    const baseAmortization = balance * 0.02; // 2% per period
    const performanceFactor = 1 - (abs.collateral.creditQuality.delinquencyRate / 100);
    return baseAmortization * performanceFactor;
  }

  private getABSDefaultRate(abs: AssetBackedSecurity, period: number): number {
    const baseRate = abs.collateral.creditQuality.defaultRate / 100;
    const seasoning = Math.min(1, period / 24); // Defaults peak around 24 months
    return baseRate * seasoning;
  }

  private estimateCallProbability(bond: CallableBond, callOption: CallOption, date: Date): number {
    // Simplified call probability based on rate incentive
    const currentRate = this.getCurrentMarketRate(bond.type);
    const incentive = bond.couponRate - currentRate;
    
    if (incentive > 1.5) return 0.9; // 150 bps incentive = 90% probability
    if (incentive > 1.0) return 0.7; // 100 bps incentive = 70% probability
    if (incentive > 0.5) return 0.4; // 50 bps incentive = 40% probability
    
    return 0.1; // Base probability
  }

  private getCurrentMarketRate(bondType: string): number {
    // Mock current market rates
    const rates = {
      'corporate': 4.5,
      'municipal': 3.5,
      'government': 3.0,
      'agency': 3.2
    };
    return rates[bondType] || 4.0;
  }

  private calculateCashFlowVariance(cashFlows: CashFlow[]): number {
    const amounts = cashFlows.map(cf => cf.total);
    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private calculateAverageLife(cashFlows: CashFlow[]): number {
    let weightedSum = 0;
    let totalPrincipal = 0;
    const startDate = cashFlows[0]?.date || new Date();

    for (const cf of cashFlows) {
      const years = (cf.date.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      weightedSum += cf.principal * years;
      totalPrincipal += cf.principal;
    }

    return totalPrincipal > 0 ? weightedSum / totalPrincipal : 0;
  }

  private calculateABSPrepaymentRisk(abs: AssetBackedSecurity): number {
    // ABS prepayment risk varies by asset type
    const riskScores = {
      'auto_loans': 30,
      'credit_cards': 10, // Credit cards have low prepayment risk
      'student_loans': 15,
      'equipment': 25,
      'receivables': 20
    };
    return riskScores[abs.assetType] || 25;
  }

  private calculateServicerRisk(abs: AssetBackedSecurity): number {
    // Based on servicer concentration and performance
    return 20; // Simplified
  }

  private async stressMBS(mbs: MortgageBackedSecurity, scenario: StressScenario): Promise<StressTestResult> {
    // Stress test implementation for MBS
    return {
      scenario: scenario.name,
      expectedLoss: mbs.currentBalance * 0.02,
      unexpectedLoss: mbs.currentBalance * 0.05,
      riskContribution: 0.15,
      capitalRequirement: mbs.currentBalance * 0.08
    };
  }

  private async stressABS(abs: AssetBackedSecurity, scenario: StressScenario): Promise<StressTestResult> {
    // Stress test implementation for ABS
    return {
      scenario: scenario.name,
      expectedLoss: abs.currentBalance * 0.03,
      unexpectedLoss: abs.currentBalance * 0.07,
      riskContribution: 0.20,
      capitalRequirement: abs.currentBalance * 0.10
    };
  }

  private async stressCallableBond(bond: CallableBond, scenario: StressScenario): Promise<StressTestResult> {
    // Stress test implementation for callable bonds
    return {
      scenario: scenario.name,
      expectedLoss: bond.outstandingAmount * 0.01,
      unexpectedLoss: bond.outstandingAmount * 0.03,
      riskContribution: 0.10,
      capitalRequirement: bond.outstandingAmount * 0.05
    };
  }

  private calculateReinvestmentRisk(bond: CallableBond): number {
    return bond.couponRate > 5 ? 60 : 30; // Higher coupon = higher reinvestment risk
  }

  private calculateNegativeConvexity(bond: CallableBond): number {
    return bond.callSchedule.length * 10; // More call options = more negative convexity
  }

  private calculateCallOptionValue(bond: CallableBond, scenarios: any[]): number {
    // Simplified option value calculation
    return bond.outstandingAmount * 0.02; // 2% of face value
  }

  private getMaturityBucket(maturityDate: Date): string {
    const years = (maturityDate.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
    if (years <= 2) return '2Y';
    if (years <= 5) return '5Y';
    if (years <= 10) return '10Y';
    return '30Y';
  }

  private generateCallAnalysisRecommendations(
    bond: CallableBond,
    probabilities: { [date: string]: number },
    expectedCallDate: Date | null,
    optionValue: number
  ): string[] {
    const recommendations: string[] = [];

    const highProbDates = Object.entries(probabilities).filter(([_, prob]) => prob > 0.7);
    
    if (highProbDates.length > 0) {
      recommendations.push('High call probability detected - consider defensive positioning');
    }

    if (optionValue > bond.outstandingAmount * 0.03) {
      recommendations.push('Call option value is significant - factor into pricing decisions');
    }

    if (expectedCallDate && expectedCallDate < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
      recommendations.push('Expected call within 1 year - prepare for reinvestment');
    }

    return recommendations;
  }

  private initializeMarketData(): void {
    // Initialize market data cache
    this.marketData.set('yield_curves', {
      treasury: { '2Y': 4.5, '5Y': 4.2, '10Y': 4.0, '30Y': 4.1 },
      corporate: { '2Y': 5.0, '5Y': 4.8, '10Y': 4.6, '30Y': 4.7 }
    });
  }

  private startPricingEngine(): void {
    // Start periodic pricing updates
    setInterval(() => {
      this.updatePricing();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private updatePricing(): void {
    // Update pricing for all securities
    this.emit('pricingUpdate', {
      mbsCount: this.mbsSecurities.size,
      absCount: this.absSecurities.size,
      bondCount: this.callableBonds.size,
      timestamp: new Date()
    });
  }
}

interface StressScenario {
  name: string;
  parameters: Record<string, any>;
}

export default StructuredProductsService;
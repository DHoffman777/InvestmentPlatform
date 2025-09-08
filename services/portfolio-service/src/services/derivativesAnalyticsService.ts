// Derivatives Analytics Service
// Phase 3.5 - Comprehensive derivatives analytics with Greeks, pricing, and risk management

import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../utils/kafka-mock';
import { logger } from '../utils/logger';
import {
  DerivativeInstrument,
  OptionContract,
  FutureContract,
  GreeksCalculation,
  GreeksCalculationRequest,
  ImpliedVolatilityAnalysis,
  ImpliedVolatilityRequest,
  OptionStrategy,
  StrategyBuilderRequest,
  MarginCalculationRequest,
  MarginCalculationResult,
  MarkToMarketValuation,
  DerivativesPortfolioAnalytics,
  DerivativesSearchRequest,
  DerivativesSearchResult,
  VolatilityModel,
  DerivativeType,
  OptionStyle,
  ExerciseEvent,
  AssignmentEvent,
  StrategyLegRequest,
  MarginPosition,
  PositionMargin,
  IVTermStructurePoint,
  ExerciseType,
  OptionStatus,
  MarginType,
  StrategyType,
  MarginScenario,
  StrategyLeg,
  StrategyBreakdown,
  ExpirationBucket
} from '../models/derivatives/DerivativesAnalytics';

export class DerivativesAnalyticsService {
  constructor(
    private prisma: PrismaClient,
    private kafkaService: ReturnType<typeof getKafkaService>
  ) {}

  // Greeks Calculations using Black-Scholes and advanced models
  async calculateGreeks(
    request: GreeksCalculationRequest,
    tenantId: string,
    userId: string
  ): Promise<GreeksCalculation> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // Get instrument details
      const instrument = await this.getDerivativeInstrument(request.securityId, tenantId);
      if (!instrument) {
        throw new Error('Derivative instrument not found');
      }

      if (instrument.derivativeType !== DerivativeType.CALL_OPTION && 
          instrument.derivativeType !== DerivativeType.PUT_OPTION) {
        throw new Error('Greeks calculation only supported for options');
      }

      const option = instrument as OptionContract;

      // Get market data or use provided values
      const underlyingPrice = request.underlyingPrice || option.underlyingPrice;
      const volatility = request.volatility || option.impliedVolatility;
      const riskFreeRate = request.riskFreeRate || await this.getRiskFreeRate(option.currency);
      const dividendYield = request.dividendYield || 0;

      // Calculate time to expiration
      const now = new Date();
      const timeToExpiration = this.calculateTimeToExpiration(option.expirationDate, now);

      if (timeToExpiration <= 0) {
        warnings.push('Option has expired, Greeks may not be meaningful');
      }

      // Validate inputs
      if (underlyingPrice <= 0) {
        throw new Error('Underlying price must be positive');
      }
      if (volatility <= 0) {
        throw new Error('Volatility must be positive');
      }
      if (timeToExpiration < 0) {
        warnings.push('Negative time to expiration detected');
      }

      // Calculate Greeks based on selected model
      const model = request.calculationMethod || VolatilityModel.BLACK_SCHOLES;
      let greeksResult: Partial<GreeksCalculation>;

      switch (model) {
        case VolatilityModel.BLACK_SCHOLES:
          greeksResult = await this.calculateBlackScholesGreeks(
            option,
            underlyingPrice,
            volatility,
            riskFreeRate,
            dividendYield,
            timeToExpiration
          );
          break;
        case VolatilityModel.BINOMIAL:
          greeksResult = await this.calculateBinomialGreeks(
            option,
            underlyingPrice,
            volatility,
            riskFreeRate,
            dividendYield,
            timeToExpiration
          );
          break;
        case VolatilityModel.MONTE_CARLO:
          greeksResult = await this.calculateMonteCarloGreeks(
            option,
            underlyingPrice,
            volatility,
            riskFreeRate,
            dividendYield,
            timeToExpiration
          );
          break;
        default:
          throw new Error(`Unsupported calculation method: ${model}`);
      }

      const greeks: GreeksCalculation = {
        id: this.generateId(),
        tenantId,
        securityId: request.securityId,
        calculationDate: new Date(),
        
        // Core Greeks
        delta: greeksResult.delta!,
        gamma: greeksResult.gamma!,
        theta: greeksResult.theta!,
        vega: greeksResult.vega!,
        rho: greeksResult.rho!,
        
        // Extended Greeks
        lambda: greeksResult.lambda,
        epsilon: greeksResult.epsilon,
        volga: greeksResult.volga,
        vanna: greeksResult.vanna,
        charm: greeksResult.charm,
        color: greeksResult.color,
        
        // Cash equivalents
        deltaCash: greeksResult.delta! * underlyingPrice,
        gammaCash: greeksResult.gamma! * underlyingPrice * underlyingPrice / 100,
        thetaDaily: greeksResult.theta! / 365,
        vegaPercent: greeksResult.vega! / 100,
        rhoPercent: greeksResult.rho! / 100,
        
        // Parameters used
        underlyingPrice,
        volatility,
        riskFreeRate,
        dividendYield,
        timeToExpiration,
        
        // Metadata
        calculationMethod: model,
        calculationTime: Date.now() - startTime,
        warnings: warnings.length > 0 ? warnings : undefined
      };

      // Store calculation result
      await this.storeGreeksCalculation(greeks);

      // Publish event
      await this.publishGreeksCalculatedEvent(greeks, userId);

      logger.info(`Greeks calculated for ${request.securityId}`, {
        tenantId,
        securityId: request.securityId,
        model,
        calculationTime: greeks.calculationTime
      });

      return greeks;

    } catch (error: any) {
      logger.error('Error calculating Greeks:', error);
      throw error;
    }
  }

  // Black-Scholes Greeks calculation
  private async calculateBlackScholesGreeks(
    option: OptionContract,
    S: number, // Stock price
    sigma: number, // Volatility
    r: number, // Risk-free rate
    q: number, // Dividend yield
    T: number // Time to expiration
  ): Promise<Partial<GreeksCalculation>> {
    const K = option.strikePrice;
    const isCall = option.derivativeType === DerivativeType.CALL_OPTION;
    
    // Calculate d1 and d2
    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    // Standard normal CDF and PDF
    const N = this.normalCDF;
    const n = this.normalPDF;
    
    // Calculate Greeks
    const delta = isCall ? 
      Math.exp(-q * T) * N(d1) : 
      Math.exp(-q * T) * (N(d1) - 1);
    
    const gamma = Math.exp(-q * T) * n(d1) / (S * sigma * Math.sqrt(T));
    
    const theta = isCall ?
      (-S * n(d1) * sigma * Math.exp(-q * T) / (2 * Math.sqrt(T)) 
       - r * K * Math.exp(-r * T) * N(d2) 
       + q * S * Math.exp(-q * T) * N(d1)) / 365 :
      (-S * n(d1) * sigma * Math.exp(-q * T) / (2 * Math.sqrt(T)) 
       + r * K * Math.exp(-r * T) * N(-d2) 
       - q * S * Math.exp(-q * T) * N(-d1)) / 365;
    
    const vega = S * Math.exp(-q * T) * n(d1) * Math.sqrt(T) / 100;
    
    const rho = isCall ?
      K * T * Math.exp(-r * T) * N(d2) / 100 :
      -K * T * Math.exp(-r * T) * N(-d2) / 100;
    
    // Higher-order Greeks
    const lambda = delta * S / this.calculateOptionPrice(option, S, sigma, r, q, T);
    
    const vanna = -Math.exp(-q * T) * n(d1) * d2 / sigma;
    
    const charm = isCall ?
      Math.exp(-q * T) * (q * N(d1) - n(d1) * (2 * (r - q) * T - d2 * sigma * Math.sqrt(T)) / (2 * T * sigma * Math.sqrt(T))) :
      Math.exp(-q * T) * (q * N(d1) - N(d1) - n(d1) * (2 * (r - q) * T - d2 * sigma * Math.sqrt(T)) / (2 * T * sigma * Math.sqrt(T)));
    
    const color = -Math.exp(-q * T) * n(d1) / (2 * S * T * sigma * Math.sqrt(T)) *
      (2 * q * T + 1 + (2 * (r - q) * T - d2 * sigma * Math.sqrt(T)) * d1 / (sigma * Math.sqrt(T)));
    
    const volga = vega * d1 * d2 / sigma;

    return {
      delta,
      gamma,
      theta,
      vega,
      rho,
      lambda,
      vanna,
      charm,
      color,
      volga
    };
  }

  // Binomial model Greeks calculation
  private async calculateBinomialGreeks(
    option: OptionContract,
    S: number,
    sigma: number,
    r: number,
    q: number,
    T: number,
    steps: number = 100
  ): Promise<Partial<GreeksCalculation>> {
    const dt = T / steps;
    const u = Math.exp(sigma * Math.sqrt(dt));
    const d = 1 / u;
    const p = (Math.exp((r - q) * dt) - d) / (u - d);
    
    // Build binomial tree
    const priceTree = this.buildBinomialPriceTree(S, u, d, steps);
    const optionTree = this.buildBinomialOptionTree(option, priceTree, r, dt, p, steps);
    
    // Calculate Greeks using finite differences
    const basePrice = optionTree[0][0];
    
    // Delta calculation
    const upTree = this.buildBinomialPriceTree(S * 1.01, u, d, steps);
    const upOptionTree = this.buildBinomialOptionTree(option, upTree, r, dt, p, steps);
    const downTree = this.buildBinomialPriceTree(S * 0.99, u, d, steps);
    const downOptionTree = this.buildBinomialOptionTree(option, downTree, r, dt, p, steps);
    
    const delta = (upOptionTree[0][0] - downOptionTree[0][0]) / (S * 0.02);
    
    // Gamma calculation
    const gamma = (upOptionTree[0][0] - 2 * basePrice + downOptionTree[0][0]) / Math.pow(S * 0.01, 2);
    
    // Theta calculation (using smaller time step)
    const smallerT = T - 1/365;
    const thetaTree = this.buildBinomialOptionTreeWithTime(option, S, sigma, r, q, smallerT, steps);
    const theta = (thetaTree[0][0] - basePrice);
    
    // Vega calculation
    const vegaUpTree = this.buildBinomialOptionTreeWithVol(option, S, sigma * 1.01, r, q, T, steps);
    const vegaDownTree = this.buildBinomialOptionTreeWithVol(option, S, sigma * 0.99, r, q, T, steps);
    const vega = (vegaUpTree[0][0] - vegaDownTree[0][0]) / (sigma * 0.02);
    
    // Rho calculation
    const rhoUpTree = this.buildBinomialOptionTreeWithRate(option, S, sigma, r * 1.01, q, T, steps);
    const rhoDownTree = this.buildBinomialOptionTreeWithRate(option, S, sigma, r * 0.99, q, T, steps);
    const rho = (rhoUpTree[0][0] - rhoDownTree[0][0]) / (r * 0.02);

    return {
      delta,
      gamma,
      theta,
      vega,
      rho
    };
  }

  // Monte Carlo Greeks calculation
  private async calculateMonteCarloGreeks(
    option: OptionContract,
    S: number,
    sigma: number,
    r: number,
    q: number,
    T: number,
    simulations: number = 100000
  ): Promise<Partial<GreeksCalculation>> {
    const dt = T / 252; // Daily steps
    const steps = Math.ceil(T * 252);
    
    let deltaSum = 0, gammaSum = 0, thetaSum = 0, vegaSum = 0, rhoSum = 0;
    
    // Monte Carlo simulation with pathwise derivatives
    for (let i = 0; i < simulations; i++) {
      const path = this.generateStockPath(S, r, q, sigma, T, steps);
      const finalPrice = path[path.length - 1];
      
      // Calculate payoff and Greeks using pathwise method
      const payoff = this.calculateOptionPayoff(option, finalPrice);
      const discountedPayoff = payoff * Math.exp(-r * T);
      
      // Pathwise derivatives
      if (payoff > 0) {
        deltaSum += discountedPayoff * Math.log(finalPrice / S) / (sigma * sigma * T);
        vegaSum += discountedPayoff * (Math.pow(Math.log(finalPrice / S), 2) / (sigma * sigma * sigma * T) - Math.log(finalPrice / S) / sigma);
      }
      
      // Use finite differences for other Greeks
      const upPayoff = this.calculateOptionPayoff(option, finalPrice * 1.01);
      const downPayoff = this.calculateOptionPayoff(option, finalPrice * 0.99);
      gammaSum += (upPayoff - 2 * payoff + downPayoff) * Math.exp(-r * T);
      
      thetaSum += discountedPayoff * (-r);
      rhoSum += discountedPayoff * T;
    }
    
    return {
      delta: deltaSum / simulations,
      gamma: gammaSum / simulations,
      theta: thetaSum / simulations,
      vega: vegaSum / simulations,
      rho: rhoSum / simulations
    };
  }

  // Implied Volatility Calculation
  async calculateImpliedVolatility(
    request: ImpliedVolatilityRequest,
    tenantId: string,
    userId: string
  ): Promise<ImpliedVolatilityAnalysis> {
    const startTime = Date.now();
    
    try {
      const instrument = await this.getDerivativeInstrument(request.securityId, tenantId);
      if (!instrument || (instrument.derivativeType !== DerivativeType.CALL_OPTION && 
                         instrument.derivativeType !== DerivativeType.PUT_OPTION)) {
        throw new Error('Invalid option instrument');
      }

      const option = instrument as OptionContract;
      const marketPrice = request.optionPrice;
      const underlyingPrice = request.underlyingPrice || option.underlyingPrice;
      const timeToExpiration = request.timeToExpiration || 
        this.calculateTimeToExpiration(option.expirationDate, new Date());
      const riskFreeRate = request.riskFreeRate || await this.getRiskFreeRate(option.currency);
      const dividendYield = request.dividendYield || 0;

      // Use Newton-Raphson method to solve for implied volatility
      const impliedVol = await this.solveImpliedVolatility(
        option,
        marketPrice,
        underlyingPrice,
        riskFreeRate,
        dividendYield,
        timeToExpiration
      );

      // Get historical context
      const historicalVol = await this.getHistoricalVolatility(option.underlyingSymbol, 30);
      const ivHistory = await this.getImpliedVolatilityHistory(request.securityId, 252);
      
      // Calculate percentile ranking
      const ivRank = this.calculatePercentileRank(impliedVol, ivHistory);
      const ivPercentile = ivRank / 100;

      // Build volatility surface data
      const termStructure = await this.buildVolatilityTermStructure(option.underlyingSymbol, tenantId);
      
      // Calculate statistical measures
      const ivStdDev = this.calculateStandardDeviation(ivHistory);
      const confidence95Upper = impliedVol + 1.96 * ivStdDev;
      const confidence95Lower = impliedVol - 1.96 * ivStdDev;

      const analysis: ImpliedVolatilityAnalysis = {
        id: this.generateId(),
        tenantId,
        securityId: request.securityId,
        analysisDate: new Date(),
        
        impliedVolatility: impliedVol,
        historicalVolatility: historicalVol,
        ivRank,
        ivPercentile,
        
        atmIV: await this.getATMImpliedVolatility(option.underlyingSymbol),
        skew: await this.calculateVolatilitySkew(option.underlyingSymbol, option.expirationDate),
        termStructure,
        
        ivStandardDeviation: ivStdDev,
        confidence95Upper,
        confidence95Lower,
        
        dataPoints: ivHistory.length,
        calculationMethod: 'Newton-Raphson'
      };

      // Store analysis
      await this.storeImpliedVolatilityAnalysis(analysis, tenantId);

      // Publish event
      await this.publishImpliedVolatilityEvent(analysis, userId);

      return analysis;

    } catch (error: any) {
      logger.error('Error calculating implied volatility:', error);
      throw error;
    }
  }

  // Option Strategy Builder
  async buildOptionStrategy(
    request: StrategyBuilderRequest,
    tenantId: string,
    userId: string
  ): Promise<OptionStrategy> {
    try {
      // Validate strategy request
      this.validateStrategyRequest(request);

      // Get underlying price and volatility
      const underlyingPrice = await this.getUnderlyingPrice(request.underlyingSymbol);
      const impliedVol = await this.getImpliedVolatility(request.underlyingSymbol);

      // Build strategy legs
      const legs = await Promise.all(
        request.legs.map(leg => this.buildStrategyLeg(leg, underlyingPrice, impliedVol, tenantId))
      );

      // Calculate strategy metrics
      const strategyMetrics = await this.calculateStrategyMetrics(legs, underlyingPrice, impliedVol);

      const strategy: OptionStrategy = {
        id: this.generateId(),
        tenantId,
        portfolioId: request.portfolioId,
        
        strategyName: this.generateStrategyName(request.strategyType),
        strategyType: request.strategyType,
        description: this.generateStrategyDescription(request.strategyType),
        
        legs,
        
        maxProfit: strategyMetrics.maxProfit,
        maxLoss: strategyMetrics.maxLoss,
        breakeven: strategyMetrics.breakeven,
        probabilityOfProfit: strategyMetrics.probabilityOfProfit,
        
        netDelta: strategyMetrics.netDelta,
        netGamma: strategyMetrics.netGamma,
        netTheta: strategyMetrics.netTheta,
        netVega: strategyMetrics.netVega,
        netRho: strategyMetrics.netRho,
        
        netPremium: strategyMetrics.netPremium,
        marginRequirement: strategyMetrics.marginRequirement,
        buyingPower: strategyMetrics.buyingPower,
        
        riskRewardRatio: strategyMetrics.riskRewardRatio,
        
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store strategy
      await this.storeOptionStrategy(strategy);

      // Publish event
      await this.publishStrategyCreatedEvent(strategy, userId);

      return strategy;

    } catch (error: any) {
      logger.error('Error building option strategy:', error);
      throw error;
    }
  }

  // Margin Calculation
  async calculateMargin(
    request: MarginCalculationRequest,
    tenantId: string,
    userId: string
  ): Promise<MarginCalculationResult> {
    try {
      const calculationDate = request.calculationDate || new Date();
      
      // Calculate position-level margins
      const positionMargins = await Promise.all(
        request.positions.map(position => 
          this.calculatePositionMargin(position, request.underlyingPrices, request.volatilities)
        )
      );

      // Calculate portfolio-level margin using SPAN methodology
      const portfolioMargin = await this.calculateSPANMargin(
        request.positions, 
        request.underlyingPrices,
        request.volatilities,
        request.scenarioShifts
      );

      // Calculate risk metrics
      const netLiquidationValue = await this.calculateNetLiquidationValue(request.positions, request.underlyingPrices as unknown as Map<string, number>);
      const portfolioRisk = await this.calculatePortfolioRisk(request.positions, request.volatilities as unknown as Map<string, number>);

      const result: MarginCalculationResult = {
        id: this.generateId(),
        requestId: this.generateId(),
        tenantId,
        calculationDate,
        
        initialMargin: (portfolioMargin as any).initialMargin || 0,
        maintenanceMargin: (portfolioMargin as any).maintenanceMargin || 0,
        variationMargin: (portfolioMargin as any).variationMargin || 0,
        
        positionMargins,
        
        portfolioMargin: (portfolioMargin as any).totalMargin || 0,
        netLiquidationValue,
        excessLiquidity: netLiquidationValue - ((portfolioMargin as any).totalMargin || 0),
        
        portfolioRisk,
        concentrationRisk: await this.calculateConcentrationRisk(request.positions),
        liquidityRisk: await this.calculateLiquidityRisk(request.positions),
        
        spanMargin: (portfolioMargin as any).spanMargin || 0,
        
        calculationMethod: 'SPAN',
        warnings: (portfolioMargin as any).warnings || []
      };

      // Store margin calculation
      await this.storeMarginCalculation(result);

      return result;

    } catch (error: any) {
      logger.error('Error calculating margin:', error);
      throw error;
    }
  }

  // Mark-to-Market Valuation
  async calculateMarkToMarket(
    securityId: string,
    tenantId: string,
    userId: string
  ): Promise<MarkToMarketValuation> {
    try {
      const instrument = await this.getDerivativeInstrument(securityId, tenantId);
      if (!instrument) {
        throw new Error('Instrument not found');
      }

      const underlyingPrice = await this.getUnderlyingPrice(instrument.underlyingSymbol);
      const volatility = await this.getImpliedVolatility(instrument.underlyingSymbol);
      const riskFreeRate = await this.getRiskFreeRate(instrument.currency);
      
      // Calculate theoretical price
      const theoreticalPrice = await this.calculateTheoreticalPrice(
        instrument,
        underlyingPrice,
        volatility,
        riskFreeRate
      );

      // Get market price
      const marketPrice = instrument.currentPrice;

      // Calculate Greeks for P&L attribution
      const greeks = await this.calculateGreeks({
        securityId,
        underlyingPrice,
        volatility,
        riskFreeRate
      }, tenantId, userId);

      // Get previous day's valuation for P&L calculation
      const previousValuation = await this.getPreviousMarkToMarket(securityId, tenantId);
      
      const valuation: MarkToMarketValuation = {
        id: this.generateId(),
        tenantId,
        securityId,
        valuationDate: new Date(),
        
        marketPrice,
        theoreticalPrice,
        intrinsicValue: this.calculateIntrinsicValue(instrument as OptionContract, underlyingPrice),
        timeValue: theoreticalPrice - this.calculateIntrinsicValue(instrument as OptionContract, underlyingPrice),
        
        unrealizedPnL: marketPrice - (instrument as any).costBasis || 0,
        dailyPnL: previousValuation ? marketPrice - previousValuation.marketPrice : 0,
        inceptionPnL: marketPrice - (instrument as any).entryPrice || 0,
        
        // Greeks P&L attribution
        deltaPnL: this.calculateDeltaPnL(greeks, previousValuation),
        gammaPnL: this.calculateGammaPnL(greeks, previousValuation),
        thetaPnL: this.calculateThetaPnL(greeks, previousValuation),
        vegaPnL: this.calculateVegaPnL(greeks, previousValuation),
        rhoPnL: this.calculateRhoPnL(greeks, previousValuation),
        residualPnL: 0, // Calculated as difference from total P&L
        
        underlyingPrice,
        volatility,
        riskFreeRate,
        timeToExpiration: this.calculateTimeToExpiration(instrument.expirationDate, new Date()),
        
        pricingModel: VolatilityModel.BLACK_SCHOLES,
        confidence: 0.95,
        
        dataSource: 'MARKET_DATA_SERVICE',
        calculationTime: Date.now() - Date.now(),
        warnings: []
      };

      // Store valuation
      await this.storeMarkToMarketValuation(valuation);

      return valuation;

    } catch (error: any) {
      logger.error('Error calculating mark-to-market valuation:', error);
      throw error;
    }
  }

  // Portfolio Analytics
  async calculatePortfolioAnalytics(
    portfolioId: string,
    tenantId: string,
    userId: string
  ): Promise<DerivativesPortfolioAnalytics> {
    try {
      // Get all derivative positions in portfolio
      const positions = await this.getPortfolioDerivativePositions(portfolioId, tenantId);
      
      if (positions.length === 0) {
        throw new Error('No derivative positions found in portfolio');
      }

      // Calculate aggregate metrics
      const totalNotional = positions.reduce((sum: number, pos: any) => sum + pos.notional, 0);
      const totalMarketValue = positions.reduce((sum: number, pos: any) => sum + pos.marketValue, 0);
      
      // Calculate portfolio Greeks
      const portfolioGreeks = await this.calculatePortfolioGreeks(positions);
      
      // Calculate risk metrics
      const portfolioVaR = await this.calculatePortfolioVaR(positions);
      const maxDrawdown = await this.calculateMaxDrawdown(portfolioId, tenantId);
      const sharpeRatio = await this.calculateSharpeRatio(portfolioId, tenantId);
      
      // Analyze active strategies
      const activeStrategies = await this.getActiveStrategies(portfolioId, tenantId);
      const strategyBreakdown = this.analyzeStrategyBreakdown(activeStrategies);
      
      // Calculate margin utilization
      const marginAnalysis = await this.calculateMarginUtilization(portfolioId, tenantId);
      
      // Analyze expirations
      const expirationBuckets = this.analyzeExpirations(positions);
      
      // Calculate performance
      const performance = await this.calculatePortfolioPerformance(portfolioId, tenantId);

      const analytics: DerivativesPortfolioAnalytics = {
        id: this.generateId(),
        tenantId,
        portfolioId,
        analysisDate: new Date(),
        
        totalPositions: positions.length,
        totalNotional,
        totalMarketValue,
        
        optionsAllocation: this.calculateOptionsAllocation(positions),
        futuresAllocation: this.calculateFuturesAllocation(positions),
        otherDerivativesAllocation: this.calculateOtherDerivativesAllocation(positions),
        
        portfolioDelta: portfolioGreeks.delta,
        portfolioGamma: portfolioGreeks.gamma,
        portfolioTheta: portfolioGreeks.theta,
        portfolioVega: portfolioGreeks.vega,
        portfolioRho: portfolioGreeks.rho,
        
        portfolioVaR,
        maxDrawdown,
        sharpeRatio,
        
        activeStrategies: activeStrategies.length,
        strategyBreakdown,
        
        totalMarginUsed: marginAnalysis.totalMarginUsed,
        availableMargin: marginAnalysis.availableMargin,
        marginUtilization: marginAnalysis.utilizationPercentage,
        
        nearTermExpirations: expirationBuckets.filter((bucket: any) => bucket.daysToExpiration <= 30),
        
        totalReturn: performance.totalReturn,
        dailyPnL: performance.dailyPnL,
        monthlyPnL: performance.monthlyPnL,
        yearToDatePnL: performance.yearToDatePnL,
        
        lastUpdated: new Date(),
        dataQuality: this.assessDataQuality(positions),
        warnings: this.generatePortfolioWarnings(positions, expirationBuckets)
      };

      // Store analytics
      await this.storePortfolioAnalytics(analytics);

      // Publish event
      await this.publishPortfolioAnalyticsEvent(analytics, userId);

      return analytics;

    } catch (error: any) {
      logger.error('Error calculating portfolio analytics:', error);
      throw error;
    }
  }

  // Search Derivatives
  async searchDerivatives(
    request: DerivativesSearchRequest,
    tenantId: string
  ): Promise<DerivativesSearchResult> {
    try {
      // Build search query
      const searchQuery = this.buildDerivativesSearchQuery(request, tenantId);
      
      // Execute search
      const instruments = await this.prisma.security.findMany(searchQuery);
      
      // Get total count
      const total = await this.prisma.security.count({
        where: searchQuery.where as any
      });

      // Calculate aggregate metrics
      const aggregateMetrics = await this.calculateSearchAggregateMetrics(instruments);

      return {
        instruments: instruments as any as DerivativeInstrument[],
        total,
        aggregateMetrics,
        pagination: {
          limit: request.limit || 50,
          offset: request.offset || 0,
          hasMore: (request.offset || 0) + instruments.length < total
        }
      };

    } catch (error: any) {
      logger.error('Error searching derivatives:', error);
      throw error;
    }
  }

  // Helper methods for calculations
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private calculateTimeToExpiration(expirationDate: Date, currentDate: Date): number {
    const diffTime = expirationDate.getTime() - currentDate.getTime();
    return diffTime / (1000 * 60 * 60 * 24 * 365.25); // Convert to years
  }

  private calculateOptionPrice(
    option: OptionContract,
    S: number,
    sigma: number,
    r: number,
    q: number,
    T: number
  ): number {
    const K = option.strikePrice;
    const isCall = option.derivativeType === DerivativeType.CALL_OPTION;
    
    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    const N = this.normalCDF;
    
    if (isCall) {
      return S * Math.exp(-q * T) * N(d1) - K * Math.exp(-r * T) * N(d2);
    } else {
      return K * Math.exp(-r * T) * N(-d2) - S * Math.exp(-q * T) * N(-d1);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Database and external service methods (placeholder implementations)
  private async getDerivativeInstrument(securityId: string, tenantId: string): Promise<DerivativeInstrument | null> {
    // Implementation would fetch from database
    return null;
  }


  private async storeGreeksCalculation(greeks: GreeksCalculation): Promise<any> {
    // Implementation would store in database
  }

  private async publishGreeksCalculatedEvent(greeks: GreeksCalculation, userId: string): Promise<any> {
    await this.kafkaService.publishEvent('derivatives.greeks.calculated', {
      ...greeks,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  private async publishImpliedVolatilityEvent(analysis: ImpliedVolatilityAnalysis, userId: string): Promise<any> {
    await this.kafkaService.publishEvent('derivatives.implied_volatility.calculated', {
      ...analysis,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  private async publishStrategyCreatedEvent(strategy: OptionStrategy, userId: string): Promise<any> {
    await this.kafkaService.publishEvent('derivatives.strategy.created', {
      ...strategy,
      userId,
      timestamp: new Date().toISOString()
    });
  }


  private buildBinomialPriceTree(S: number, u: number, d: number, steps: number): number[][] {
    const tree: number[][] = [];
    
    for (let i = 0; i <= steps; i++) {
      tree[i] = [];
      for (let j = 0; j <= i; j++) {
        tree[i][j] = S * Math.pow(u, i - j) * Math.pow(d, j);
      }
    }
    
    return tree;
  }

  private buildBinomialOptionTree(
    option: OptionContract,
    priceTree: number[][],
    r: number,
    dt: number,
    p: number,
    steps: number
  ): number[][] {
    const tree: number[][] = [];
    const strike = option.strikePrice;
    const isCall = option.derivativeType === DerivativeType.CALL_OPTION;
    
    // Initialize final nodes
    tree[steps] = [];
    for (let j = 0; j <= steps; j++) {
      const S = priceTree[steps][j];
      tree[steps][j] = Math.max(0, isCall ? S - strike : strike - S);
    }
    
    // Work backwards
    for (let i = steps - 1; i >= 0; i--) {
      tree[i] = [];
      for (let j = 0; j <= i; j++) {
        const continuationValue = Math.exp(-r * dt) * (p * tree[i + 1][j] + (1 - p) * tree[i + 1][j + 1]);
        const S = priceTree[i][j];
        const intrinsicValue = Math.max(0, isCall ? S - strike : strike - S);
        
        tree[i][j] = option.optionStyle === OptionStyle.AMERICAN 
          ? Math.max(continuationValue, intrinsicValue)
          : continuationValue;
      }
    }
    
    return tree;
  }

  private buildBinomialOptionTreeWithTime(
    option: OptionContract,
    S: number,
    sigma: number,
    r: number,
    q: number,
    T: number,
    steps: number
  ): number[][] {
    const dt = T / steps;
    const u = Math.exp(sigma * Math.sqrt(dt));
    const d = 1 / u;
    const p = (Math.exp((r - q) * dt) - d) / (u - d);
    
    const priceTree = this.buildBinomialPriceTree(S, u, d, steps);
    return this.buildBinomialOptionTree(option, priceTree, r, dt, p, steps);
  }

  private generateStockPath(S: number, r: number, q: number, sigma: number, T: number, steps: number): number[] {
    const dt = T / steps;
    const path: number[] = [S];
    
    for (let i = 1; i <= steps; i++) {
      const z = this.generateNormalRandom();
      const drift = (r - q - 0.5 * sigma * sigma) * dt;
      const diffusion = sigma * Math.sqrt(dt) * z;
      path[i] = path[i - 1] * Math.exp(drift + diffusion);
    }
    
    return path;
  }

  private generateNormalRandom(): number {
    // Box-Muller transform for normal distribution
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  private async buildVolatilityTermStructure(symbol: string, tenantId: string): Promise<any> {
    // Stub implementation - would fetch from market data
    return {
      curve: [],
      atmVol: 0.25,
      skew: 0.0,
      model: VolatilityModel.BLACK_SCHOLES
    };
  }

  private async buildStrategyLeg(leg: StrategyLegRequest, underlyingPrice: number, impliedVol: number, tenantId: string): Promise<StrategyLeg> {
    // Build strategy leg with proper structure
    return {
      id: this.generateId(),
      securityId: (leg as any).securityId || this.generateId(),
      side: leg.side || 'BUY',
      quantity: leg.quantity || 1,
      strikePrice: leg.strikePrice,
      expirationDate: leg.expirationDate,
      optionType: leg.optionType,
      entryPrice: (leg as any).entryPrice || underlyingPrice * 0.05,
      currentPrice: (leg as any).entryPrice || underlyingPrice * 0.05,
      premium: (leg as any).entryPrice || underlyingPrice * 0.05,
      deltaContribution: 0.5 * leg.quantity,
      gammaContribution: 0.01 * leg.quantity,
      thetaContribution: -0.02 * leg.quantity,
      vegaContribution: 0.1 * leg.quantity,
      rhoContribution: 0.03 * leg.quantity
    };
  }

  private buildDerivativesSearchQuery(request: DerivativesSearchRequest, tenantId: string): any {
    // Stub implementation for search query building
    return {
      where: {
        tenantId
      }
    };
  }

  private async getMarketPrice(securityId: string, tenantId: string): Promise<number> {
    // Stub implementation - would fetch from market data service
    return 100; // Default price
  }

  private async getImpliedVolatility(securityId: string, tenantId?: string): Promise<number> {
    // Stub implementation - would calculate or fetch implied volatility
    return 0.25; // Default 25% volatility
  }

  private async getRiskFreeRate(currency: string): Promise<number> {
    // Stub implementation - would fetch risk-free rate
    return 0.05; // Default 5% rate
  }

  private async getDividendYield(underlyingId: string, tenantId: string): Promise<number> {
    // Stub implementation - would fetch dividend yield
    return 0.02; // Default 2% yield
  }

  private calculateExercisePayoff(option: OptionContract, underlyingPrice: number): number {
    if (option.derivativeType === DerivativeType.CALL_OPTION) {
      return Math.max(underlyingPrice - option.strikePrice, 0) * option.contractSize;
    } else {
      return Math.max(option.strikePrice - underlyingPrice, 0) * option.contractSize;
    }
  }

  private async recordExerciseEvent(event: ExerciseEvent): Promise<void> {
    // Stub implementation - would record to database
    await this.kafkaService.publishEvent('portfolio.derivatives.exercise', event);
  }

  private async recordAssignmentEvent(event: AssignmentEvent): Promise<void> {
    // Stub implementation - would record to database
    await this.kafkaService.publishEvent('portfolio.derivatives.assignment', event);
  }

  private buildBinomialOptionTreeWithVol(
    option: OptionContract,
    S: number,
    sigma: number,
    r: number,
    q: number,
    T: number,
    steps: number
  ): number[][] {
    return this.buildBinomialOptionTreeWithTime(option, S, sigma, r, q, T, steps);
  }

  private buildBinomialOptionTreeWithRate(
    option: OptionContract,
    S: number,
    sigma: number,
    r: number,
    q: number,
    T: number,
    steps: number
  ): number[][] {
    return this.buildBinomialOptionTreeWithTime(option, S, sigma, r, q, T, steps);
  }

  // Additional helper methods
  private calculateTimeToExpiry(expirationDate: Date): number {
    const now = new Date();
    const timeInMs = expirationDate.getTime() - now.getTime();
    return Math.max(timeInMs / (365 * 24 * 60 * 60 * 1000), 0);
  }

  private calculateVolatilitySmile(strikes: number[], atmVol: number, skew: number): number[] {
    // Simple volatility smile calculation
    return strikes.map(strike => atmVol * (1 + skew * Math.log(strike / 100) / 100));
  }

  private calculateOptionPayoff(option: OptionContract, finalPrice: number): number {
    if (option.derivativeType === DerivativeType.CALL_OPTION) {
      return Math.max(finalPrice - option.strikePrice, 0);
    } else {
      return Math.max(option.strikePrice - finalPrice, 0);
    }
  }

  private async solveImpliedVolatility(
    option: OptionContract,
    marketPrice: number,
    S: number,
    r: number,
    q: number,
    T: number
  ): Promise<number> {
    // Newton-Raphson method for implied volatility
    let sigma = 0.3; // Initial guess
    const tolerance = 0.0001;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      const price = await this.calculateBinomialOptionPrice(option, S, sigma, r, q, T, 100);
      const vega = (await this.calculateBinomialOptionPrice(option, S, sigma + 0.01, r, q, T, 100) - price) / 0.01;
      
      const diff = price - marketPrice;
      if (Math.abs(diff) < tolerance) {
        return sigma;
      }
      
      sigma = sigma - diff / vega;
      sigma = Math.max(0.001, Math.min(3, sigma)); // Keep within reasonable bounds
    }
    
    return sigma;
  }

  private async getHistoricalVolatility(securityId: string, days: number = 30): Promise<number> {
    // Stub - would calculate from historical prices
    return 0.25;
  }

  private async getImpliedVolatilityHistory(securityId: string, days: number = 30): Promise<number[]> {
    // Stub - would fetch historical implied volatilities
    return Array(days).fill(0.25);
  }

  private calculatePercentileRank(value: number, array: number[]): number {
    const sorted = array.sort((a, b) => a - b);
    let count = 0;
    for (const v of sorted) {
      if (v <= value) count++;
      else break;
    }
    return (count / array.length) * 100;
  }

  private calculateStandardDeviation(array: number[]): number {
    const mean = array.reduce((a, b) => a + b, 0) / array.length;
    const squaredDiffs = array.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / array.length;
    return Math.sqrt(variance);
  }

  private async getATMImpliedVolatility(underlyingSymbol: string): Promise<number> {
    // Stub - would find ATM option and get its IV
    return 0.25;
  }

  private async calculateVolatilitySkew(underlyingSymbol: string, expirationDate: Date): Promise<number> {
    // Stub - would calculate skew from volatility smile
    return 0.1;
  }

  private async storeImpliedVolatilityAnalysis(analysis: ImpliedVolatilityAnalysis, tenantId: string): Promise<void> {
    // Stub - would store to database
    await this.kafkaService.publishEvent('portfolio.derivatives.iv', { analysis, tenantId });
  }

  private validateStrategyRequest(request: StrategyBuilderRequest | any): void {
    if (!request.legs || request.legs.length === 0) {
      throw new Error('Strategy must have at least one leg');
    }
  }

  private async getUnderlyingPrice(underlyingId: string, tenantId?: string): Promise<number> {
    // Stub - would fetch from market data service
    return 100;
  }

  private async calculateStrategyMetrics(
    legs: any[],
    underlyingPrice: number,
    impliedVolatility: number
  ): Promise<any> {
    // Stub implementation
    return {
      totalDelta: 0,
      totalGamma: 0,
      totalTheta: 0,
      totalVega: 0,
      totalRho: 0,
      maxProfit: 0,
      maxLoss: 0,
      breakevens: []
    };
  }

  // Missing helper methods
  private async calculatePositionMargin(
    position: MarginPosition,
    underlyingPrices: Record<string, number>,
    volatilities: Record<string, number>
  ): Promise<PositionMargin> {
    const underlyingPrice = underlyingPrices[position.securityId] || position.price;
    const volatility = volatilities[position.securityId] || 0.25;
    
    // Simple margin calculation - in real implementation would use more sophisticated models
    const notionalValue = Math.abs(position.quantity * underlyingPrice);
    const volatilityAdjustment = 1 + volatility;
    
    const initialMargin = notionalValue * 0.15 * volatilityAdjustment;
    const maintenanceMargin = notionalValue * 0.10 * volatilityAdjustment;
    const riskContribution = notionalValue * volatility;
    
    return {
      securityId: position.securityId,
      initialMargin,
      maintenanceMargin,
      riskContribution,
      hedgeCredit: position.side === 'SHORT' ? initialMargin * 0.1 : undefined
    };
  }

  private async calculateSPANMargin(
    positions: MarginPosition[],
    underlyingPrices: Record<string, number>,
    volatilities: Record<string, number>,
    scenarioShifts?: MarginScenario[]
  ): Promise<number> {
    // Simplified SPAN margin calculation
    let maxLoss = 0;
    
    const scenarios = scenarioShifts || [
      { name: 'base', underlyingShift: 0, volatilityShift: 0, timeDecay: 0 },
      { name: 'up15', underlyingShift: 0.15, volatilityShift: 0.05, timeDecay: 1 },
      { name: 'down15', underlyingShift: -0.15, volatilityShift: 0.05, timeDecay: 1 }
    ];
    
    for (const scenario of scenarios) {
      let scenarioLoss = 0;
      
      for (const position of positions) {
        const price = underlyingPrices[position.securityId] || position.price;
        const shiftedPrice = price * (1 + scenario.underlyingShift);
        const positionValue = position.quantity * (position.side === 'LONG' ? 1 : -1);
        const pnl = positionValue * (shiftedPrice - price);
        scenarioLoss = Math.min(scenarioLoss, pnl);
      }
      
      maxLoss = Math.max(maxLoss, Math.abs(scenarioLoss));
    }
    
    return maxLoss;
  }


  private generateStrategyName(strategyType: StrategyType): string {
    const names: Record<StrategyType, string> = {
      [StrategyType.SINGLE_OPTION]: 'Single Option',
      [StrategyType.COVERED_CALL]: 'Covered Call',
      [StrategyType.PROTECTIVE_PUT]: 'Protective Put',
      [StrategyType.STRADDLE]: 'Straddle',
      [StrategyType.STRANGLE]: 'Strangle',
      [StrategyType.SPREAD_BULL_CALL]: 'Bull Call Spread',
      [StrategyType.SPREAD_BULL_PUT]: 'Bull Put Spread',
      [StrategyType.SPREAD_BEAR_CALL]: 'Bear Call Spread',
      [StrategyType.SPREAD_BEAR_PUT]: 'Bear Put Spread',
      [StrategyType.IRON_CONDOR]: 'Iron Condor',
      [StrategyType.IRON_BUTTERFLY]: 'Iron Butterfly',
      [StrategyType.COLLAR]: 'Collar',
      [StrategyType.CUSTOM]: 'Custom Strategy'
    };
    
    return names[strategyType] || 'Unknown Strategy';
  }

  private generateStrategyDescription(strategyType: StrategyType): string {
    const descriptions: Record<StrategyType, string> = {
      [StrategyType.COVERED_CALL]: 'Selling call options against long stock position',
      [StrategyType.PROTECTIVE_PUT]: 'Buying put options to protect long stock position',
      [StrategyType.STRADDLE]: 'Simultaneous purchase of call and put at same strike',
      [StrategyType.STRANGLE]: 'Simultaneous purchase of call and put at different strikes',
      [StrategyType.IRON_CONDOR]: 'Combination of bull put spread and bear call spread',
      [StrategyType.IRON_BUTTERFLY]: 'Combination of bull put spread and bear call spread at same short strike',
      [StrategyType.COLLAR]: 'Long stock with protective put and covered call',
      [StrategyType.SINGLE_OPTION]: 'Single option position',
      [StrategyType.SPREAD_BULL_CALL]: 'Buy lower strike call, sell higher strike call',
      [StrategyType.SPREAD_BULL_PUT]: 'Buy lower strike put, sell higher strike put',
      [StrategyType.SPREAD_BEAR_CALL]: 'Buy higher strike call, sell lower strike call',
      [StrategyType.SPREAD_BEAR_PUT]: 'Buy higher strike put, sell lower strike put',
      [StrategyType.CUSTOM]: 'Custom multi-leg options strategy'
    };
    
    return descriptions[strategyType] || 'Custom options strategy';
  }

  private async storeOptionStrategy(strategy: OptionStrategy): Promise<void> {
    // Store in database - stub implementation
    logger.info('Storing option strategy', { strategyId: strategy.id });
  }

  // Missing method implementations for margin and portfolio calculations
  private async calculateNetLiquidationValue(positions: MarginPosition[], underlyingPrices: Map<string, number>): Promise<number> {
    let totalValue = 0;
    for (const position of positions) {
      const price = underlyingPrices.get((position as any).underlyingSymbol || '') || 0;
      totalValue += position.quantity * price * ((position as any).contractSize || 1);
    }
    return totalValue;
  }

  private async calculatePortfolioRisk(positions: MarginPosition[], volatilities: Map<string, number>): Promise<number> {
    // Simple portfolio risk calculation
    let totalRisk = 0;
    for (const position of positions) {
      const vol = volatilities.get((position as any).underlyingSymbol || '') || 0.2;
      totalRisk += Math.abs(position.quantity) * ((position as any).contractSize || 1) * vol;
    }
    return totalRisk;
  }

  private async calculateConcentrationRisk(positions: MarginPosition[]): Promise<number> {
    // Calculate concentration risk based on position sizing
    if (positions.length === 0) return 0;
    const totalNotional = positions.reduce((sum, p) => sum + Math.abs(p.quantity * ((p as any).contractSize || 1)), 0);
    const maxPosition = Math.max(...positions.map(p => Math.abs(p.quantity * ((p as any).contractSize || 1))));
    return maxPosition / totalNotional;
  }

  private async calculateLiquidityRisk(positions: MarginPosition[]): Promise<number> {
    // Simple liquidity risk score (0-1)
    const avgVolume = positions.reduce((sum, p) => sum + ((p as any).averageDailyVolume || 1000), 0) / positions.length;
    const totalSize = positions.reduce((sum, p) => sum + Math.abs(p.quantity), 0);
    return Math.min(totalSize / avgVolume, 1);
  }

  private async storeMarginCalculation(result: MarginCalculationResult): Promise<void> {
    logger.info('Storing margin calculation', { requestId: result.requestId });
  }

  private async calculateTheoreticalPrice(
    instrument: DerivativeInstrument,
    underlyingPrice: number,
    volatility: number,
    riskFreeRate: number
  ): Promise<number> {
    // Use Black-Scholes for options
    if (instrument.derivativeType === DerivativeType.CALL_OPTION || instrument.derivativeType === DerivativeType.PUT_OPTION) {
      const option = instrument as OptionContract;
      const timeToExpiry = this.calculateTimeToExpiration(option.expirationDate, new Date());
      return this.calculateOptionPrice(
        option,
        underlyingPrice,
        volatility,
        riskFreeRate,
        0,
        timeToExpiry
      );
    }
    return instrument.currentPrice || 0;
  }

  private async getPreviousMarkToMarket(securityId: string, tenantId: string): Promise<MarkToMarketValuation | null> {
    // Get previous valuation from database - stub implementation
    return null;
  }

  private calculateIntrinsicValue(option: OptionContract, underlyingPrice: number): number {
    if (option.derivativeType === DerivativeType.CALL_OPTION) {
      return Math.max(underlyingPrice - option.strikePrice, 0);
    } else if (option.derivativeType === DerivativeType.PUT_OPTION) {
      return Math.max(option.strikePrice - underlyingPrice, 0);
    }
    return 0;
  }

  private calculateDeltaPnL(greeks: GreeksCalculation, previousValuation: MarkToMarketValuation | null): number {
    if (!previousValuation) return 0;
    return greeks.delta * (greeks.underlyingPrice - previousValuation.underlyingPrice);
  }

  private calculateGammaPnL(greeks: GreeksCalculation, previousValuation: MarkToMarketValuation | null): number {
    if (!previousValuation) return 0;
    const priceDiff = greeks.underlyingPrice - previousValuation.underlyingPrice;
    return 0.5 * greeks.gamma * priceDiff * priceDiff;
  }

  private calculateThetaPnL(greeks: GreeksCalculation, previousValuation: MarkToMarketValuation | null): number {
    if (!previousValuation) return 0;
    return greeks.theta / 365; // Daily theta decay
  }

  private calculateVegaPnL(greeks: GreeksCalculation, previousValuation: MarkToMarketValuation | null): number {
    if (!previousValuation) return 0;
    return greeks.vega * ((greeks as any).impliedVolatility || greeks.volatility - previousValuation.volatility);
  }

  private calculateRhoPnL(greeks: GreeksCalculation, previousValuation: MarkToMarketValuation | null): number {
    if (!previousValuation) return 0;
    return greeks.rho * (greeks.riskFreeRate - previousValuation.riskFreeRate);
  }

  private async storeMarkToMarketValuation(valuation: MarkToMarketValuation): Promise<void> {
    logger.info('Storing mark-to-market valuation', { valuationId: valuation.id });
  }

  // Portfolio analytics helper methods
  private async getPortfolioDerivativePositions(portfolioId: string, tenantId: string): Promise<any[]> {
    // Get derivative positions from database - stub implementation
    return [];
  }

  private async calculatePortfolioGreeks(positions: any[]): Promise<any> {
    return {
      delta: positions.reduce((sum: number, p: any) => sum + (p.delta || 0), 0),
      gamma: positions.reduce((sum: number, p: any) => sum + (p.gamma || 0), 0),
      theta: positions.reduce((sum: number, p: any) => sum + (p.theta || 0), 0),
      vega: positions.reduce((sum: number, p: any) => sum + (p.vega || 0), 0),
      rho: positions.reduce((sum: number, p: any) => sum + (p.rho || 0), 0)
    };
  }

  private async calculatePortfolioVaR(positions: any[]): Promise<number> {
    // Simple VaR calculation - stub implementation
    const totalValue = positions.reduce((sum: number, p: any) => sum + (p.marketValue || 0), 0);
    return totalValue * 0.05; // 5% VaR
  }

  private async calculateMaxDrawdown(portfolioId: string, tenantId: string): Promise<number> {
    // Calculate max drawdown - stub implementation
    return 0.15; // 15% max drawdown
  }

  private async calculateSharpeRatio(portfolioId: string, tenantId: string): Promise<number> {
    // Calculate Sharpe ratio - stub implementation
    return 1.5;
  }

  private async getActiveStrategies(portfolioId: string, tenantId: string): Promise<any[]> {
    // Get active strategies - stub implementation
    return [];
  }

  private analyzeStrategyBreakdown(strategies: any[]): StrategyBreakdown[] {
    const breakdown: StrategyBreakdown[] = [];
    const types = ['COVERED_CALL', 'PROTECTIVE_PUT', 'SPREAD', 'STRADDLE', 'STRANGLE'];
    
    types.forEach(type => {
      const strategyGroup = strategies.filter((s: any) => s.type === type);
      if (strategyGroup.length > 0) {
        breakdown.push({
          strategyType: type as StrategyType,
          count: strategyGroup.length,
          totalNotional: strategyGroup.reduce((sum: number, s: any) => sum + (s.notional || 0), 0),
          totalMargin: strategyGroup.reduce((sum: number, s: any) => sum + (s.margin || 0), 0),
          netPnL: strategyGroup.reduce((sum: number, s: any) => sum + (s.pnl || 0), 0)
        });
      }
    });
    
    return breakdown;
  }

  private async calculateMarginUtilization(portfolioId: string, tenantId: string): Promise<any> {
    return {
      totalMarginUsed: 50000,
      availableMargin: 150000,
      utilizationPercentage: 0.25
    };
  }

  private analyzeExpirations(positions: any[]): ExpirationBucket[] {
    // Group positions by expiration buckets
    const buckets: ExpirationBucket[] = [];
    const now = new Date();
    
    [7, 14, 30, 60, 90, 180, 365].forEach(days => {
      const count = positions.filter((p: any) => {
        if (!p.expirationDate) return false;
        const daysToExpiry = Math.ceil((new Date(p.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysToExpiry <= days && daysToExpiry > (days === 7 ? 0 : [7, 14, 30, 60, 90, 180][Math.max(0, [7, 14, 30, 60, 90, 180].indexOf(days) - 1)]);
      }).length;
      
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + days);
      buckets.push({
        expirationDate: expDate,
        daysToExpiration: days,
        positionCount: count,
        totalNotional: count * 10000,
        totalGamma: count * 0.01,
        totalTheta: count * -10,
        rollRisk: count * 0.05
      });
    });
    
    return buckets;
  }

  private async calculatePortfolioPerformance(portfolioId: string, tenantId: string): Promise<any> {
    return {
      totalReturn: 0.12,
      dailyPnL: 1500,
      monthlyPnL: 45000,
      yearToDatePnL: 250000
    };
  }

  private calculateOptionsAllocation(positions: any[]): number {
    const totalValue = positions.reduce((sum: number, p: any) => sum + (p.marketValue || 0), 0);
    const optionsValue = positions
      .filter((p: any) => p.instrumentType === 'OPTION')
      .reduce((sum: number, p: any) => sum + (p.marketValue || 0), 0);
    return totalValue > 0 ? optionsValue / totalValue : 0;
  }

  private calculateFuturesAllocation(positions: any[]): number {
    const totalValue = positions.reduce((sum: number, p: any) => sum + (p.marketValue || 0), 0);
    const futuresValue = positions
      .filter((p: any) => p.instrumentType === 'FUTURE')
      .reduce((sum: number, p: any) => sum + (p.marketValue || 0), 0);
    return totalValue > 0 ? futuresValue / totalValue : 0;
  }

  private calculateOtherDerivativesAllocation(positions: any[]): number {
    const totalValue = positions.reduce((sum: number, p: any) => sum + (p.marketValue || 0), 0);
    const otherValue = positions
      .filter((p: any) => !['OPTION', 'FUTURE'].includes(p.instrumentType))
      .reduce((sum: number, p: any) => sum + (p.marketValue || 0), 0);
    return totalValue > 0 ? otherValue / totalValue : 0;
  }

  private assessDataQuality(positions: any[]): number {
    // Assess data quality score (0-1)
    const withPrices = positions.filter((p: any) => (p as any).marketPrice && (p as any).marketPrice > 0).length;
    return positions.length > 0 ? withPrices / positions.length : 0;
  }

  private generatePortfolioWarnings(positions: any[], expirationBuckets: ExpirationBucket[]): string[] {
    const warnings: string[] = [];
    
    // Check for near-term expirations
    const nearTermCount = expirationBuckets.find(b => b.daysToExpiration === 7)?.positionCount || 0;
    if (nearTermCount > 0) {
      warnings.push(`${nearTermCount} positions expiring within 7 days`);
    }
    
    // Check for concentration
    if (positions.length > 0 && positions.length < 5) {
      warnings.push('Portfolio may be under-diversified');
    }
    
    return warnings;
  }

  private async storePortfolioAnalytics(analytics: DerivativesPortfolioAnalytics): Promise<void> {
    logger.info('Storing portfolio analytics', { portfolioId: analytics.portfolioId });
  }

  private async publishPortfolioAnalyticsEvent(analytics: DerivativesPortfolioAnalytics, userId: string): Promise<void> {
    await this.kafkaService.publishEvent('portfolio.analytics.calculated', {
      analytics,
      userId,
      timestamp: new Date()
    });
  }

  private async calculateSearchAggregateMetrics(instruments: any[]): Promise<any> {
    return {
      totalCount: instruments.length,
      avgPrice: instruments.reduce((sum, i) => sum + (i.price || 0), 0) / instruments.length,
      totalVolume: instruments.reduce((sum, i) => sum + (i.volume || 0), 0)
    };
  }

  private async calculateBinomialOptionPrice(
    option: OptionContract,
    S: number,
    sigma: number,
    r: number,
    q: number,
    T: number,
    steps: number
  ): Promise<number> {
    const tree = this.buildBinomialOptionTreeWithTime(option, S, sigma, r, q, T, steps);
    return tree[0][0];
  }

}


// Stress Testing and Scenario Analysis Service
// Phase 4.3 - Comprehensive stress testing implementation for risk management

import { PrismaClient } from '@prisma/client';
import { KafkaService } from '../../utils/kafka-mock';
import { logger } from '../../utils/logger';
import {
  StressTestRequest,
  StressTestResult,
  StressScenario,
  ScenarioResult,
  FactorShock,
  PositionImpact,
  FactorSensitivity,
  CorrelationChange
} from '../../models/riskManagement/RiskManagement';

export class StressTestingService {
  constructor(
    private prisma: PrismaClient,
    private kafkaService: KafkaService
  ) {}

  // Main stress test execution
  async executeStressTest(request: StressTestRequest): Promise<StressTestResult> {
    try {
      logger.info('Executing stress test', {
        portfolioId: request.portfolioId,
        scenarioCount: request.stressScenarios.length
      });

      const startTime = Date.now();

      // Get portfolio data
      const portfolioData = await this.getPortfolioData(request.portfolioId, request.asOfDate);
      const marketData = await this.getMarketData(portfolioData, request.asOfDate);

      // Add historical scenarios if requested
      let allScenarios = [...request.stressScenarios];
      if (request.includeHistoricalScenarios) {
        const historicalScenarios = await this.getHistoricalScenarios();
        allScenarios = [...allScenarios, ...historicalScenarios];
      }

      // Execute each stress scenario
      const scenarioResults: ScenarioResult[] = [];
      for (const scenario of allScenarios) {
        const scenarioResult = await this.executeScenario(scenario, portfolioData, marketData);
        scenarioResults.push(scenarioResult);
      }

      // Calculate summary statistics
      const worstCaseScenario = scenarioResults.reduce((worst, current) => 
        current.portfolioChange < worst.portfolioChange ? current : worst
      );

      const bestCaseScenario = scenarioResults.reduce((best, current) => 
        current.portfolioChange > best.portfolioChange ? current : best
      );

      const averageImpact = scenarioResults.reduce((sum, result) => 
        sum + result.portfolioChange, 0
      ) / scenarioResults.length;

      // Calculate stressed risk metrics
      const stressedVaR = await this.calculateStressedVaR(scenarioResults, portfolioData);
      const stressedVolatility = await this.calculateStressedVolatility(scenarioResults);
      const maxDrawdown = Math.abs(worstCaseScenario.portfolioChange);

      // Analyze factor sensitivities
      const factorSensitivities = await this.analyzeFactorSensitivities(allScenarios, scenarioResults);

      const stressTestResult: StressTestResult = {
        id: `stress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        portfolioId: request.portfolioId,
        tenantId: request.tenantId,
        calculationDate: new Date(),
        asOfDate: request.asOfDate,
        scenarioResults,
        worstCaseScenario,
        bestCaseScenario,
        averageImpact,
        stressedVaR,
        stressedVolatility,
        maxDrawdown,
        factorSensitivities,
        createdAt: new Date(),
        calculatedBy: 'system'
      };

      // Store results
      await this.storeStressTestResult(stressTestResult);

      // Publish stress test event
      await this.publishStressTestEvent('STRESS_TEST_COMPLETED', stressTestResult);

      logger.info('Stress test completed', {
        portfolioId: request.portfolioId,
        worstCase: worstCaseScenario.portfolioChangePercent,
        bestCase: bestCaseScenario.portfolioChangePercent,
        executionTime: Date.now() - startTime
      });

      return stressTestResult;

    } catch (error) {
      logger.error('Error executing stress test:', error);
      throw error;
    }
  }

  // Execute individual scenario
  private async executeScenario(
    scenario: StressScenario,
    portfolioData: any[],
    marketData: any
  ): Promise<ScenarioResult> {
    logger.debug('Executing scenario', { scenarioId: scenario.id, scenarioName: scenario.name });

    // Calculate base portfolio value
    const basePortfolioValue = portfolioData.reduce((sum, position) => sum + position.marketValue, 0);

    // Apply factor shocks to portfolio positions
    const positionImpacts: PositionImpact[] = [];
    let totalPortfolioChange = 0;

    for (const position of portfolioData) {
      const positionImpact = await this.calculatePositionImpact(position, scenario.factorShocks, marketData);
      positionImpacts.push(positionImpact);
      totalPortfolioChange += positionImpact.absoluteChange;
    }

    // Calculate stressed portfolio value
    const stressedPortfolioValue = basePortfolioValue + totalPortfolioChange;
    const portfolioChangePercent = (totalPortfolioChange / basePortfolioValue) * 100;

    // Calculate VaR under this scenario
    const varUnderScenario = await this.calculateVaRUnderScenario(portfolioData, scenario.factorShocks);
    
    // Calculate volatility under this scenario
    const volatilityUnderScenario = await this.calculateVolatilityUnderScenario(portfolioData, scenario.factorShocks);

    // Analyze correlation changes
    const correlationChanges = await this.analyzeCorrelationChanges(portfolioData, scenario.factorShocks);

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      portfolioValue: stressedPortfolioValue,
      portfolioChange: totalPortfolioChange,
      portfolioChangePercent,
      positionImpacts,
      varUnderScenario,
      volatilityUnderScenario,
      correlationChanges
    };
  }

  // Calculate position-level impact from factor shocks
  private async calculatePositionImpact(
    position: any,
    factorShocks: FactorShock[],
    marketData: any
  ): Promise<PositionImpact> {
    let totalImpact = 0;
    const currentValue = position.marketValue;

    // Apply relevant factor shocks to this position
    for (const shock of factorShocks) {
      const sensitivity = await this.getPositionSensitivity(position, shock, marketData);
      const impact = this.calculateShockImpact(currentValue, shock, sensitivity);
      totalImpact += impact;
    }

    const stressedValue = currentValue + totalImpact;
    const percentChange = (totalImpact / currentValue) * 100;

    return {
      positionId: position.positionId,
      instrumentId: position.instrumentId,
      symbol: position.symbol,
      currentValue,
      stressedValue,
      absoluteChange: totalImpact,
      percentChange,
      contributionToPortfolioChange: totalImpact // Simplified - should be calculated at portfolio level
    };
  }

  // Get position sensitivity to specific factor
  private async getPositionSensitivity(
    position: any,
    shock: FactorShock,
    marketData: any
  ): Promise<number> {
    // Determine sensitivity based on asset class and factor type
    switch (shock.factorType) {
      case 'EQUITY_INDEX':
        return await this.getEquityIndexSensitivity(position, shock);
      case 'INTEREST_RATE':
        return await this.getInterestRateSensitivity(position, shock);
      case 'CREDIT_SPREAD':
        return await this.getCreditSpreadSensitivity(position, shock);
      case 'CURRENCY':
        return await this.getCurrencySensitivity(position, shock);
      case 'COMMODITY':
        return await this.getCommoditySensitivity(position, shock);
      case 'VOLATILITY':
        return await this.getVolatilitySensitivity(position, shock);
      default:
        return 0;
    }
  }

  // Calculate impact of factor shock on position value
  private calculateShockImpact(
    currentValue: number,
    shock: FactorShock,
    sensitivity: number
  ): number {
    if (shock.shockType === 'RELATIVE') {
      return currentValue * (shock.shockValue / 100) * sensitivity;
    } else {
      return sensitivity * shock.shockValue;
    }
  }

  // Specific sensitivity calculations
  private async getEquityIndexSensitivity(position: any, shock: FactorShock): Promise<number> {
    // Beta calculation - simplified
    if (position.assetClass === 'EQUITY') {
      // Get position's beta to the relevant index
      const beta = await this.getPositionBeta(position, shock.factorName);
      return beta;
    }
    return 0;
  }

  private async getInterestRateSensitivity(position: any, shock: FactorShock): Promise<number> {
    // Duration-based sensitivity for fixed income
    if (position.assetClass === 'FIXED_INCOME') {
      const duration = await this.getPositionDuration(position);
      return -duration; // Negative because bond prices move opposite to rates
    }
    // Discount rate sensitivity for equities
    if (position.assetClass === 'EQUITY') {
      return -0.1; // Simplified: 10% sensitivity to interest rate changes
    }
    return 0;
  }

  private async getCreditSpreadSensitivity(position: any, shock: FactorShock): Promise<number> {
    if (position.assetClass === 'FIXED_INCOME' && position.creditRating) {
      const creditDuration = await this.getCreditDuration(position);
      return -creditDuration;
    }
    return 0;
  }

  private async getCurrencySensitivity(position: any, shock: FactorShock): Promise<number> {
    // Check if position has foreign currency exposure
    if (position.currency !== 'USD' && position.currency === shock.currency) {
      return 1.0; // Full exposure to currency movement
    }
    return 0;
  }

  private async getCommoditySensitivity(position: any, shock: FactorShock): Promise<number> {
    if (position.assetClass === 'COMMODITY' || position.sector === 'ENERGY') {
      return 0.5; // 50% sensitivity to commodity shocks
    }
    return 0;
  }

  private async getVolatilitySensitivity(position: any, shock: FactorShock): Promise<number> {
    // Options positions have high volatility sensitivity
    if (position.instrumentType === 'OPTION') {
      const vega = await this.getOptionVega(position);
      return vega;
    }
    return 0;
  }

  // Historical scenarios
  private async getHistoricalScenarios(): Promise<StressScenario[]> {
    return [
      {
        id: 'covid_2020',
        name: 'COVID-19 Market Crash (March 2020)',
        description: 'Replicates the market conditions during the COVID-19 pandemic onset',
        scenarioType: 'HISTORICAL',
        probability: 0.05,
        factorShocks: [
          {
            factorName: 'S&P 500',
            factorType: 'EQUITY_INDEX',
            shockType: 'RELATIVE',
            shockValue: -34,
            region: 'US'
          },
          {
            factorName: '10Y Treasury',
            factorType: 'INTEREST_RATE',
            shockType: 'ABSOLUTE',
            shockValue: -150, // -1.5% in basis points
            maturity: '10Y'
          },
          {
            factorName: 'Investment Grade Credit',
            factorType: 'CREDIT_SPREAD',
            shockType: 'ABSOLUTE',
            shockValue: 200 // +2% in basis points
          },
          {
            factorName: 'VIX',
            factorType: 'VOLATILITY',
            shockType: 'ABSOLUTE',
            shockValue: 50 // VIX spike to 80+
          }
        ],
        historicalPeriod: {
          startDate: new Date('2020-02-19'),
          endDate: new Date('2020-03-23'),
          eventName: 'COVID-19 Market Crash'
        }
      },
      {
        id: 'gfc_2008',
        name: 'Global Financial Crisis (2008)',
        description: 'Replicates the 2008 financial crisis market conditions',
        scenarioType: 'HISTORICAL',
        probability: 0.02,
        factorShocks: [
          {
            factorName: 'S&P 500',
            factorType: 'EQUITY_INDEX',
            shockType: 'RELATIVE',
            shockValue: -57,
            region: 'US'
          },
          {
            factorName: 'High Yield Credit',
            factorType: 'CREDIT_SPREAD',
            shockType: 'ABSOLUTE',
            shockValue: 1500 // +15% spread widening
          },
          {
            factorName: 'Real Estate',
            factorType: 'EQUITY_INDEX',
            shockType: 'RELATIVE',
            shockValue: -70
          }
        ],
        historicalPeriod: {
          startDate: new Date('2007-10-09'),
          endDate: new Date('2009-03-09'),
          eventName: 'Global Financial Crisis'
        }
      },
      {
        id: 'dotcom_2000',
        name: 'Dot-Com Bubble Burst (2000-2002)',
        description: 'Technology sector crash and bear market',
        scenarioType: 'HISTORICAL',
        probability: 0.03,
        factorShocks: [
          {
            factorName: 'NASDAQ',
            factorType: 'EQUITY_INDEX',
            shockType: 'RELATIVE',
            shockValue: -78,
            region: 'US'
          },
          {
            factorName: 'Technology Sector',
            factorType: 'EQUITY_INDEX',
            shockType: 'RELATIVE',
            shockValue: -80
          }
        ],
        historicalPeriod: {
          startDate: new Date('2000-03-10'),
          endDate: new Date('2002-10-09'),
          eventName: 'Dot-Com Crash'
        }
      }
    ];
  }

  // Calculate stressed VaR
  private async calculateStressedVaR(
    scenarioResults: ScenarioResult[],
    portfolioData: any[]
  ): Promise<number> {
    // Use worst-case scenario loss as stressed VaR
    const worstLoss = Math.min(...scenarioResults.map(r => r.portfolioChange));
    return Math.abs(worstLoss);
  }

  // Calculate stressed volatility
  private async calculateStressedVolatility(scenarioResults: ScenarioResult[]): Promise<number> {
    const returns = scenarioResults.map(r => r.portfolioChangePercent / 100);
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100; // Convert to percentage
  }

  // Analyze factor sensitivities across scenarios
  private async analyzeFactorSensitivities(
    scenarios: StressScenario[],
    results: ScenarioResult[]
  ): Promise<FactorSensitivity[]> {
    const factorSensitivities: FactorSensitivity[] = [];
    const factorMap = new Map<string, { shocks: number[], impacts: number[] }>();

    // Collect factor shocks and their impacts
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      const result = results[i];

      for (const shock of scenario.factorShocks) {
        const key = `${shock.factorType}_${shock.factorName}`;
        if (!factorMap.has(key)) {
          factorMap.set(key, { shocks: [], impacts: [] });
        }

        factorMap.get(key)!.shocks.push(shock.shockValue);
        factorMap.get(key)!.impacts.push(result.portfolioChange);
      }
    }

    // Calculate sensitivities using regression
    for (const [factorKey, data] of factorMap.entries()) {
      const sensitivity = await this.calculateLinearRegression(data.shocks, data.impacts);
      const totalImpact = data.impacts.reduce((sum, impact) => sum + Math.abs(impact), 0);
      const contribution = totalImpact / results.reduce((sum, r) => sum + Math.abs(r.portfolioChange), 0);

      factorSensitivities.push({
        factorName: factorKey,
        sensitivity: sensitivity.slope,
        contribution: totalImpact,
        percentContribution: contribution * 100
      });
    }

    return factorSensitivities.sort((a, b) => b.contribution - a.contribution);
  }

  // Analyze correlation changes under stress
  private async analyzeCorrelationChanges(
    portfolioData: any[],
    factorShocks: FactorShock[]
  ): Promise<CorrelationChange[]> {
    const correlationChanges: CorrelationChange[] = [];

    // Get base correlations
    const baseCorrelations = await this.getBaseCorrelations(portfolioData);

    // Calculate stressed correlations
    const stressedCorrelations = await this.getStressedCorrelations(portfolioData, factorShocks);

    // Compare correlations
    for (let i = 0; i < portfolioData.length; i++) {
      for (let j = i + 1; j < portfolioData.length; j++) {
        const asset1 = portfolioData[i].symbol;
        const asset2 = portfolioData[j].symbol;
        const baseCorr = baseCorrelations[i][j];
        const stressedCorr = stressedCorrelations[i][j];
        const corrChange = stressedCorr - baseCorr;

        if (Math.abs(corrChange) > 0.1) { // Only report significant changes
          correlationChanges.push({
            asset1,
            asset2,
            baseCorrelation: baseCorr,
            stressedCorrelation: stressedCorr,
            correlationChange: corrChange
          });
        }
      }
    }

    return correlationChanges;
  }

  // Calculate VaR under specific scenario
  private async calculateVaRUnderScenario(
    portfolioData: any[],
    factorShocks: FactorShock[]
  ): Promise<number> {
    // Simplified - increase base VaR by stress factor
    const baseVaR = portfolioData.reduce((sum, pos) => sum + pos.marketValue, 0) * 0.02; // 2% base VaR
    const stressFactor = 1 + (factorShocks.length * 0.5); // Increase VaR based on number of shocks
    return baseVaR * stressFactor;
  }

  // Calculate volatility under stress
  private async calculateVolatilityUnderScenario(
    portfolioData: any[],
    factorShocks: FactorShock[]
  ): Promise<number> {
    // Base volatility increased by stress factors
    const baseVolatility = 0.15; // 15% base volatility
    const volatilityIncrease = factorShocks.reduce((sum, shock) => {
      return sum + Math.abs(shock.shockValue / 100) * 0.1;
    }, 0);
    
    return baseVolatility + volatilityIncrease;
  }

  // Helper methods
  private async getPortfolioData(portfolioId: string, asOfDate: Date): Promise<any[]> {
    // Simulate portfolio data retrieval
    return [
      {
        positionId: 'pos_001',
        instrumentId: 'AAPL',
        symbol: 'AAPL',
        marketValue: 1000000,
        assetClass: 'EQUITY',
        sector: 'TECHNOLOGY',
        currency: 'USD',
        instrumentType: 'STOCK'
      },
      {
        positionId: 'pos_002',
        instrumentId: 'GOOGL',
        symbol: 'GOOGL',
        marketValue: 800000,
        assetClass: 'EQUITY',
        sector: 'TECHNOLOGY',
        currency: 'USD',
        instrumentType: 'STOCK'
      },
      {
        positionId: 'pos_003',
        instrumentId: 'US10Y',
        symbol: 'US10Y',
        marketValue: 500000,
        assetClass: 'FIXED_INCOME',
        sector: 'GOVERNMENT',
        currency: 'USD',
        instrumentType: 'BOND'
      }
    ];
  }

  private async getMarketData(portfolioData: any[], asOfDate: Date): Promise<any> {
    // Simulate market data retrieval
    return {
      prices: {},
      betas: {},
      durations: {},
      correlations: {}
    };
  }

  private async getPositionBeta(position: any, indexName: string): Promise<number> {
    // Simplified beta calculation
    const betaMap: Record<string, number> = {
      'AAPL': 1.2,
      'GOOGL': 1.1,
      'MSFT': 0.9
    };
    return betaMap[position.symbol] || 1.0;
  }

  private async getPositionDuration(position: any): Promise<number> {
    // Simplified duration calculation
    if (position.assetClass === 'FIXED_INCOME') {
      return 7.5; // Average duration
    }
    return 0;
  }

  private async getCreditDuration(position: any): Promise<number> {
    // Credit spread duration
    return 5.0; // Simplified
  }

  private async getOptionVega(position: any): Promise<number> {
    // Option vega (volatility sensitivity)
    return 0.15; // Simplified
  }

  private async calculateLinearRegression(x: number[], y: number[]): Promise<{ slope: number, intercept: number }> {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private async getBaseCorrelations(portfolioData: any[]): Promise<number[][]> {
    // Simplified correlation matrix
    const n = portfolioData.length;
    const correlations: number[][] = [];
    for (let i = 0; i < n; i++) {
      correlations[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          correlations[i][j] = 1.0;
        } else {
          correlations[i][j] = 0.6; // Base correlation
        }
      }
    }
    return correlations;
  }

  private async getStressedCorrelations(portfolioData: any[], factorShocks: FactorShock[]): Promise<number[][]> {
    // Correlations increase under stress
    const baseCorr = await this.getBaseCorrelations(portfolioData);
    const stressIncrease = 0.2; // Correlations increase by 20% under stress

    return baseCorr.map(row => 
      row.map(corr => Math.min(1.0, corr + (corr < 1.0 ? stressIncrease : 0)))
    );
  }

  private async storeStressTestResult(result: StressTestResult): Promise<void> {
    logger.debug('Storing stress test result', { stressTestId: result.id });
    // Implement database storage
  }

  private async publishStressTestEvent(eventType: string, result: StressTestResult): Promise<void> {
    try {
      await this.kafkaService.publishEvent('risk-management', {
        eventType,
        stressTestId: result.id,
        portfolioId: result.portfolioId,
        tenantId: result.tenantId,
        timestamp: new Date(),
        data: result
      });
    } catch (error) {
      logger.error('Error publishing stress test event:', error);
    }
  }
}
// Correlation and Concentration Analysis Service
// Phase 4.3 - Advanced correlation analysis and concentration risk measurement

import { PrismaClient } from '@prisma/client';
import { KafkaService } from '../../utils/kafka-mock';
import { logger } from '../../utils/logger';
import {
  CorrelationAnalysisRequest,
  CorrelationAnalysisResult,
  CorrelationMatrix,
  PrincipalComponent,
  ComponentLoading,
  ConcentrationMetrics,
  CategoryConcentration,
  RiskContribution
} from '../../models/riskManagement/RiskManagement';

export class CorrelationAnalysisService {
  constructor(
    private prisma: PrismaClient,
    private kafkaService: KafkaService
  ) {}

  // Main correlation analysis execution
  async analyzeCorrelations(request: CorrelationAnalysisRequest): Promise<CorrelationAnalysisResult> {
    try {
      logger.info('Starting correlation analysis', {
        portfolioId: request.portfolioId,
        lookbackPeriod: request.lookbackPeriod
      });

      const startTime = Date.now();

      // Get portfolio data and historical returns
      const portfolioData = await this.getPortfolioData(request.portfolioId, request.asOfDate);
      const historicalReturns = await this.getHistoricalReturns(portfolioData, request);

      // Calculate position correlations
      const positionCorrelations = await this.calculatePositionCorrelations(
        portfolioData,
        historicalReturns
      );

      // Calculate asset class correlations if requested
      let assetClassCorrelations: CorrelationMatrix | undefined;
      if (request.includeAssetClasses) {
        assetClassCorrelations = await this.calculateAssetClassCorrelations(
          portfolioData,
          historicalReturns
        );
      }

      // Calculate sector correlations if requested
      let sectorCorrelations: CorrelationMatrix | undefined;
      if (request.includeSectors) {
        sectorCorrelations = await this.calculateSectorCorrelations(
          portfolioData,
          historicalReturns
        );
      }

      // Calculate geography correlations if requested
      let geographyCorrelations: CorrelationMatrix | undefined;
      if (request.includeGeographies) {
        geographyCorrelations = await this.calculateGeographyCorrelations(
          portfolioData,
          historicalReturns
        );
      }

      // Calculate concentration metrics
      const concentrationMetrics = await this.calculateConcentrationMetrics(portfolioData);

      // Calculate diversification metrics
      const diversificationRatio = await this.calculateDiversificationRatio(
        portfolioData,
        positionCorrelations
      );
      const effectiveNumberOfBets = await this.calculateEffectiveNumberOfBets(portfolioData);

      // Calculate risk contributions
      const riskContributions = await this.calculateRiskContributions(
        portfolioData,
        positionCorrelations
      );

      const result: CorrelationAnalysisResult = {
        id: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        portfolioId: request.portfolioId,
        tenantId: request.tenantId,
        calculationDate: new Date(),
        asOfDate: request.asOfDate,
        lookbackPeriod: request.lookbackPeriod,
        positionCorrelations,
        assetClassCorrelations,
        sectorCorrelations,
        geographyCorrelations,
        concentrationMetrics,
        diversificationRatio,
        effectiveNumberOfBets,
        riskContributions,
        createdAt: new Date(),
        calculatedBy: 'system'
      };

      // Store results
      await this.storeCorrelationAnalysis(result);

      // Publish correlation analysis event
      await this.publishCorrelationEvent('CORRELATION_ANALYSIS_COMPLETED', result);

      logger.info('Correlation analysis completed', {
        portfolioId: request.portfolioId,
        diversificationRatio: result.diversificationRatio,
        executionTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logger.error('Error performing correlation analysis:', error);
      throw error;
    }
  }

  // Calculate position-level correlation matrix
  private async calculatePositionCorrelations(
    portfolioData: any[],
    historicalReturns: number[][]
  ): Promise<CorrelationMatrix> {
    const numPositions = portfolioData.length;
    const correlationMatrix: number[][] = [];
    const assets = portfolioData.map(pos => pos.symbol);

    // Initialize correlation matrix
    for (let i = 0; i < numPositions; i++) {
      correlationMatrix[i] = [];
      for (let j = 0; j < numPositions; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1.0;
        } else {
          const correlation = await this.calculatePearsonCorrelation(
            historicalReturns.map(day => day[i]),
            historicalReturns.map(day => day[j])
          );
          correlationMatrix[i][j] = correlation;
        }
      }
    }

    // Perform eigenvalue decomposition for principal component analysis
    const eigenanalysis = await this.performEigenAnalysis(correlationMatrix);

    return {
      assets,
      matrix: correlationMatrix,
      eigenvalues: eigenanalysis.eigenvalues,
      principalComponents: eigenanalysis.principalComponents
    };
  }

  // Calculate asset class correlation matrix
  private async calculateAssetClassCorrelations(
    portfolioData: any[],
    historicalReturns: number[][]
  ): Promise<CorrelationMatrix> {
    // Group positions by asset class
    const assetClassReturns = await this.aggregateReturnsByCategory(
      portfolioData,
      historicalReturns,
      'assetClass'
    );

    const assetClasses = Object.keys(assetClassReturns);
    const numAssetClasses = assetClasses.length;
    const correlationMatrix: number[][] = [];

    // Calculate correlations between asset classes
    for (let i = 0; i < numAssetClasses; i++) {
      correlationMatrix[i] = [];
      for (let j = 0; j < numAssetClasses; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1.0;
        } else {
          const correlation = await this.calculatePearsonCorrelation(
            assetClassReturns[assetClasses[i]],
            assetClassReturns[assetClasses[j]]
          );
          correlationMatrix[i][j] = correlation;
        }
      }
    }

    const eigenanalysis = await this.performEigenAnalysis(correlationMatrix);

    return {
      assets: assetClasses,
      matrix: correlationMatrix,
      eigenvalues: eigenanalysis.eigenvalues,
      principalComponents: eigenanalysis.principalComponents
    };
  }

  // Calculate sector correlation matrix
  private async calculateSectorCorrelations(
    portfolioData: any[],
    historicalReturns: number[][]
  ): Promise<CorrelationMatrix> {
    const sectorReturns = await this.aggregateReturnsByCategory(
      portfolioData,
      historicalReturns,
      'sector'
    );

    const sectors = Object.keys(sectorReturns);
    const numSectors = sectors.length;
    const correlationMatrix: number[][] = [];

    for (let i = 0; i < numSectors; i++) {
      correlationMatrix[i] = [];
      for (let j = 0; j < numSectors; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1.0;
        } else {
          const correlation = await this.calculatePearsonCorrelation(
            sectorReturns[sectors[i]],
            sectorReturns[sectors[j]]
          );
          correlationMatrix[i][j] = correlation;
        }
      }
    }

    const eigenanalysis = await this.performEigenAnalysis(correlationMatrix);

    return {
      assets: sectors,
      matrix: correlationMatrix,
      eigenvalues: eigenanalysis.eigenvalues,
      principalComponents: eigenanalysis.principalComponents
    };
  }

  // Calculate geography correlation matrix
  private async calculateGeographyCorrelations(
    portfolioData: any[],
    historicalReturns: number[][]
  ): Promise<CorrelationMatrix> {
    const geographyReturns = await this.aggregateReturnsByCategory(
      portfolioData,
      historicalReturns,
      'geography'
    );

    const geographies = Object.keys(geographyReturns);
    const numGeographies = geographies.length;
    const correlationMatrix: number[][] = [];

    for (let i = 0; i < numGeographies; i++) {
      correlationMatrix[i] = [];
      for (let j = 0; j < numGeographies; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1.0;
        } else {
          const correlation = await this.calculatePearsonCorrelation(
            geographyReturns[geographies[i]],
            geographyReturns[geographies[j]]
          );
          correlationMatrix[i][j] = correlation;
        }
      }
    }

    const eigenanalysis = await this.performEigenAnalysis(correlationMatrix);

    return {
      assets: geographies,
      matrix: correlationMatrix,
      eigenvalues: eigenanalysis.eigenvalues,
      principalComponents: eigenanalysis.principalComponents
    };
  }

  // Calculate Pearson correlation coefficient
  private async calculatePearsonCorrelation(x: number[], y: number[]): Promise<number> {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    // Calculate means
    const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

    // Calculate covariance and variances
    let covariance = 0;
    let varianceX = 0;
    let varianceY = 0;

    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      covariance += deltaX * deltaY;
      varianceX += deltaX * deltaX;
      varianceY += deltaY * deltaY;
    }

    // Calculate correlation coefficient
    const denominator = Math.sqrt(varianceX * varianceY);
    return denominator === 0 ? 0 : covariance / denominator;
  }

  // Perform eigenvalue decomposition for PCA
  private async performEigenAnalysis(matrix: number[][]): Promise<{
    eigenvalues: number[];
    principalComponents: PrincipalComponent[];
  }> {
    const n = matrix.length;
    
    // Simplified eigenvalue calculation using power iteration method
    // In production, use a proper linear algebra library like ml-matrix
    const eigenvalues: number[] = [];
    const eigenvectors: number[][] = [];

    // Calculate first few principal components
    for (let comp = 0; comp < Math.min(5, n); comp++) {
      const { eigenvalue, eigenvector } = await this.powerIteration(matrix, eigenvectors);
      eigenvalues.push(eigenvalue);
      eigenvectors.push(eigenvector);
    }

    // Calculate total variance for normalization
    const totalVariance = eigenvalues.reduce((sum, val) => sum + Math.abs(val), 0);
    let cumulativeVariance = 0;

    const principalComponents: PrincipalComponent[] = eigenvalues.map((eigenvalue, index) => {
      const varianceExplained = (Math.abs(eigenvalue) / totalVariance) * 100;
      cumulativeVariance += varianceExplained;

      const loadings: ComponentLoading[] = eigenvectors[index].map((loading, assetIndex) => ({
        assetId: `asset_${assetIndex}`,
        loading
      }));

      return {
        componentNumber: index + 1,
        eigenvalue,
        varianceExplained,
        cumulativeVarianceExplained: cumulativeVariance,
        loadings
      };
    });

    return { eigenvalues, principalComponents };
  }

  // Power iteration method for eigenvalue calculation
  private async powerIteration(
    matrix: number[][],
    excludeVectors: number[][] = []
  ): Promise<{ eigenvalue: number; eigenvector: number[] }> {
    const n = matrix.length;
    let vector = Array(n).fill(0).map(() => Math.random() - 0.5);
    
    // Orthogonalize against previous eigenvectors
    for (const prevVector of excludeVectors) {
      const projection = vector.reduce((sum, val, i) => sum + val * prevVector[i], 0);
      for (let i = 0; i < n; i++) {
        vector[i] -= projection * prevVector[i];
      }
    }

    // Normalize
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    vector = vector.map(val => val / norm);

    // Power iteration
    for (let iter = 0; iter < 100; iter++) {
      // Multiply by matrix
      const newVector = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newVector[i] += matrix[i][j] * vector[j];
        }
      }

      // Calculate eigenvalue (Rayleigh quotient)
      const eigenvalue = newVector.reduce((sum, val, i) => sum + val * vector[i], 0);

      // Normalize new vector
      const newNorm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
      const normalizedVector = newVector.map(val => val / newNorm);

      // Check convergence
      const convergence = normalizedVector.reduce((sum, val, i) => sum + Math.abs(val - vector[i]), 0);
      if (convergence < 1e-6) {
        return { eigenvalue, eigenvector: normalizedVector };
      }

      vector = normalizedVector;
    }

    // Return best estimate if not converged
    const eigenvalue = vector.reduce((sum, val, i) => {
      return sum + val * matrix[i].reduce((rowSum, matVal, j) => rowSum + matVal * vector[j], 0);
    }, 0);

    return { eigenvalue, eigenvector: vector };
  }

  // Calculate comprehensive concentration metrics
  private async calculateConcentrationMetrics(portfolioData: any[]): Promise<ConcentrationMetrics> {
    const totalValue = portfolioData.reduce((sum, pos) => sum + pos.marketValue, 0);
    
    // Calculate weights
    const weights = portfolioData.map(pos => pos.marketValue / totalValue);
    
    // Herfindahl-Hirschman Index
    const herfindahlIndex = weights.reduce((sum, weight) => sum + weight * weight, 0);
    
    // Sort positions by value for top concentration calculations
    const sortedPositions = [...portfolioData].sort((a, b) => b.marketValue - a.marketValue);
    
    // Top 5 and Top 10 concentration
    const top5Value = sortedPositions.slice(0, 5).reduce((sum, pos) => sum + pos.marketValue, 0);
    const top10Value = sortedPositions.slice(0, 10).reduce((sum, pos) => sum + pos.marketValue, 0);
    const top5Concentration = (top5Value / totalValue) * 100;
    const top10Concentration = (top10Value / totalValue) * 100;
    
    // Effective number of positions
    const effectiveNumberOfPositions = 1 / herfindahlIndex;

    // Concentration by categories
    const assetClassConcentration = await this.calculateCategoryConcentration(portfolioData, 'assetClass');
    const sectorConcentration = await this.calculateCategoryConcentration(portfolioData, 'sector');
    const geographyConcentration = await this.calculateCategoryConcentration(portfolioData, 'geography');
    const currencyConcentration = await this.calculateCategoryConcentration(portfolioData, 'currency');

    return {
      herfindahlIndex,
      top5Concentration,
      top10Concentration,
      effectiveNumberOfPositions,
      assetClassConcentration,
      sectorConcentration,
      geographyConcentration,
      currencyConcentration
    };
  }

  // Calculate concentration by category
  private async calculateCategoryConcentration(
    portfolioData: any[],
    category: string
  ): Promise<CategoryConcentration[]> {
    const totalValue = portfolioData.reduce((sum, pos) => sum + pos.marketValue, 0);
    const categoryMap = new Map<string, number>();

    // Aggregate by category
    for (const position of portfolioData) {
      const categoryValue = position[category] || 'UNKNOWN';
      const currentValue = categoryMap.get(categoryValue) || 0;
      categoryMap.set(categoryValue, currentValue + position.marketValue);
    }

    // Convert to sorted array
    const concentrations: CategoryConcentration[] = Array.from(categoryMap.entries())
      .map(([categoryName, value]) => ({
        category: categoryName,
        percentage: (value / totalValue) * 100,
        rank: 0 // Will be set after sorting
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Set ranks
    concentrations.forEach((conc, index) => {
      conc.rank = index + 1;
    });

    return concentrations;
  }

  // Calculate diversification ratio
  private async calculateDiversificationRatio(
    portfolioData: any[],
    correlationMatrix: CorrelationMatrix
  ): Promise<number> {
    const weights = await this.calculatePortfolioWeights(portfolioData);
    const volatilities = await this.getAssetVolatilities(portfolioData);
    
    // Weighted average of individual volatilities
    const weightedAverageVolatility = weights.reduce((sum, weight, i) => 
      sum + weight * volatilities[i], 0
    );
    
    // Portfolio volatility using correlation matrix
    let portfolioVariance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        portfolioVariance += weights[i] * weights[j] * volatilities[i] * 
          volatilities[j] * correlationMatrix.matrix[i][j];
      }
    }
    const portfolioVolatility = Math.sqrt(portfolioVariance);
    
    // Diversification ratio
    return weightedAverageVolatility / portfolioVolatility;
  }

  // Calculate effective number of bets
  private async calculateEffectiveNumberOfBets(portfolioData: any[]): Promise<number> {
    const weights = await this.calculatePortfolioWeights(portfolioData);
    const sumSquaredWeights = weights.reduce((sum, weight) => sum + weight * weight, 0);
    return 1 / sumSquaredWeights;
  }

  // Calculate risk contributions
  private async calculateRiskContributions(
    portfolioData: any[],
    correlationMatrix: CorrelationMatrix
  ): Promise<RiskContribution[]> {
    const weights = await this.calculatePortfolioWeights(portfolioData);
    const volatilities = await this.getAssetVolatilities(portfolioData);
    
    // Calculate portfolio variance
    let portfolioVariance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        portfolioVariance += weights[i] * weights[j] * volatilities[i] * 
          volatilities[j] * correlationMatrix.matrix[i][j];
      }
    }
    const portfolioVolatility = Math.sqrt(portfolioVariance);

    const riskContributions: RiskContribution[] = [];
    
    for (let i = 0; i < portfolioData.length; i++) {
      // Calculate marginal risk contribution
      let marginalContribution = 0;
      for (let j = 0; j < weights.length; j++) {
        marginalContribution += weights[j] * volatilities[i] * volatilities[j] * 
          correlationMatrix.matrix[i][j];
      }
      marginalContribution /= portfolioVolatility;
      
      // Risk contribution = weight * marginal contribution
      const riskContribution = weights[i] * marginalContribution;
      const percentContribution = (riskContribution / portfolioVolatility) * 100;

      riskContributions.push({
        assetId: portfolioData[i].positionId,
        symbol: portfolioData[i].symbol,
        riskContribution,
        percentContribution,
        marginalRisk: marginalContribution
      });
    }

    return riskContributions.sort((a, b) => b.riskContribution - a.riskContribution);
  }

  // Helper methods
  private async getPortfolioData(portfolioId: string, asOfDate: Date): Promise<any[]> {
    // Simulate portfolio data retrieval
    return [
      {
        positionId: 'pos_001',
        symbol: 'AAPL',
        marketValue: 1000000,
        assetClass: 'EQUITY',
        sector: 'TECHNOLOGY',
        geography: 'US',
        currency: 'USD'
      },
      {
        positionId: 'pos_002',
        symbol: 'GOOGL',
        marketValue: 800000,
        assetClass: 'EQUITY',
        sector: 'TECHNOLOGY',
        geography: 'US',
        currency: 'USD'
      },
      {
        positionId: 'pos_003',
        symbol: 'JNJ',
        marketValue: 600000,
        assetClass: 'EQUITY',
        sector: 'HEALTHCARE',
        geography: 'US',
        currency: 'USD'
      },
      {
        positionId: 'pos_004',
        symbol: 'BND',
        marketValue: 500000,
        assetClass: 'FIXED_INCOME',
        sector: 'GOVERNMENT',
        geography: 'US',
        currency: 'USD'
      },
      {
        positionId: 'pos_005',
        symbol: 'VTI',
        marketValue: 400000,
        assetClass: 'EQUITY',
        sector: 'DIVERSIFIED',
        geography: 'US',
        currency: 'USD'
      }
    ];
  }

  private async getHistoricalReturns(
    portfolioData: any[],
    request: CorrelationAnalysisRequest
  ): Promise<number[][]> {
    // Simulate historical returns for lookback period
    const returns: number[][] = [];
    const numPositions = portfolioData.length;
    
    for (let day = 0; day < request.lookbackPeriod; day++) {
      const dayReturns: number[] = [];
      for (let pos = 0; pos < numPositions; pos++) {
        // Generate correlated returns with some realistic patterns
        let baseReturn = (Math.random() - 0.5) * 0.04; // Base random return
        
        // Add sector correlation
        if (portfolioData[pos].sector === 'TECHNOLOGY') {
          baseReturn += (Math.random() - 0.5) * 0.01; // Tech sector factor
        }
        
        dayReturns.push(baseReturn);
      }
      returns.push(dayReturns);
    }
    
    return returns;
  }

  private async aggregateReturnsByCategory(
    portfolioData: any[],
    historicalReturns: number[][],
    category: string
  ): Promise<Record<string, number[]>> {
    const categoryReturns: Record<string, number[]> = {};
    const categoryWeights: Record<string, number[]> = {};
    
    // Group positions by category and calculate weights
    const totalValue = portfolioData.reduce((sum, pos) => sum + pos.marketValue, 0);
    
    for (let i = 0; i < portfolioData.length; i++) {
      const categoryValue = portfolioData[i][category] || 'UNKNOWN';
      const weight = portfolioData[i].marketValue / totalValue;
      
      if (!categoryReturns[categoryValue]) {
        categoryReturns[categoryValue] = Array(historicalReturns.length).fill(0);
        categoryWeights[categoryValue] = [];
      }
      
      categoryWeights[categoryValue].push(weight);
      
      // Add weighted returns
      for (let day = 0; day < historicalReturns.length; day++) {
        categoryReturns[categoryValue][day] += historicalReturns[day][i] * weight;
      }
    }
    
    // Normalize by total category weight
    for (const category of Object.keys(categoryReturns)) {
      const totalWeight = categoryWeights[category].reduce((sum, w) => sum + w, 0);
      if (totalWeight > 0) {
        categoryReturns[category] = categoryReturns[category].map(ret => ret / totalWeight);
      }
    }
    
    return categoryReturns;
  }

  private async calculatePortfolioWeights(portfolioData: any[]): Promise<number[]> {
    const totalValue = portfolioData.reduce((sum, pos) => sum + pos.marketValue, 0);
    return portfolioData.map(pos => pos.marketValue / totalValue);
  }

  private async getAssetVolatilities(portfolioData: any[]): Promise<number[]> {
    // Simulate volatilities based on asset class
    return portfolioData.map(position => {
      switch (position.assetClass) {
        case 'EQUITY':
          return position.sector === 'TECHNOLOGY' ? 0.25 : 0.20; // 20-25% annual volatility
        case 'FIXED_INCOME':
          return 0.05; // 5% annual volatility
        default:
          return 0.15; // 15% default volatility
      }
    });
  }

  private async storeCorrelationAnalysis(result: CorrelationAnalysisResult): Promise<void> {
    logger.debug('Storing correlation analysis result', { correlationId: result.id });
    // Implement database storage
  }

  private async publishCorrelationEvent(eventType: string, result: CorrelationAnalysisResult): Promise<void> {
    try {
      await this.kafkaService.publishEvent('risk-management', {
        eventType,
        correlationAnalysisId: result.id,
        portfolioId: result.portfolioId,
        tenantId: result.tenantId,
        timestamp: new Date(),
        data: result
      });
    } catch (error) {
      logger.error('Error publishing correlation analysis event:', error);
    }
  }
}
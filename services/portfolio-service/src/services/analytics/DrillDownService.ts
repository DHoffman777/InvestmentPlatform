import { randomUUID } from 'crypto';
import {
  AnalyticsDataPoint,
  DrillDownLevel,
  DrillDownRequest,
  DrillDownResponse,
  AnalyticsMetricType,
  AnalyticsFilter
} from '../../models/analytics/Analytics';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';

interface DrillDownContext {
  tenantId: string;
  portfolioIds?: string[];
  clientIds?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

interface DrillDownHierarchy {
  level: DrillDownLevel;
  children: DrillDownLevel[];
  parentPath: string[];
}

export class DrillDownService {
  private eventPublisher: EventPublisher;
  
  private hierarchies: Map<AnalyticsMetricType, DrillDownHierarchy[]> = new Map([
    [AnalyticsMetricType.PORTFOLIO_PERFORMANCE, [
      {
        level: DrillDownLevel.PORTFOLIO,
        children: [DrillDownLevel.ASSET_CLASS],
        parentPath: []
      },
      {
        level: DrillDownLevel.ASSET_CLASS,
        children: [DrillDownLevel.SECTOR],
        parentPath: [DrillDownLevel.PORTFOLIO]
      },
      {
        level: DrillDownLevel.SECTOR,
        children: [DrillDownLevel.INDUSTRY],
        parentPath: [DrillDownLevel.PORTFOLIO, DrillDownLevel.ASSET_CLASS]
      },
      {
        level: DrillDownLevel.INDUSTRY,
        children: [DrillDownLevel.SECURITY],
        parentPath: [DrillDownLevel.PORTFOLIO, DrillDownLevel.ASSET_CLASS, DrillDownLevel.SECTOR]
      },
      {
        level: DrillDownLevel.SECURITY,
        children: [DrillDownLevel.POSITION],
        parentPath: [DrillDownLevel.PORTFOLIO, DrillDownLevel.ASSET_CLASS, DrillDownLevel.SECTOR, DrillDownLevel.INDUSTRY]
      },
      {
        level: DrillDownLevel.POSITION,
        children: [],
        parentPath: [DrillDownLevel.PORTFOLIO, DrillDownLevel.ASSET_CLASS, DrillDownLevel.SECTOR, DrillDownLevel.INDUSTRY, DrillDownLevel.SECURITY]
      }
    ]],
    [AnalyticsMetricType.ASSET_ALLOCATION, [
      {
        level: DrillDownLevel.ASSET_CLASS,
        children: [DrillDownLevel.SECTOR],
        parentPath: []
      },
      {
        level: DrillDownLevel.SECTOR,
        children: [DrillDownLevel.INDUSTRY],
        parentPath: [DrillDownLevel.ASSET_CLASS]
      },
      {
        level: DrillDownLevel.INDUSTRY,
        children: [DrillDownLevel.SECURITY],
        parentPath: [DrillDownLevel.ASSET_CLASS, DrillDownLevel.SECTOR]
      },
      {
        level: DrillDownLevel.SECURITY,
        children: [],
        parentPath: [DrillDownLevel.ASSET_CLASS, DrillDownLevel.SECTOR, DrillDownLevel.INDUSTRY]
      }
    ]],
    [AnalyticsMetricType.RISK_METRICS, [
      {
        level: DrillDownLevel.PORTFOLIO,
        children: [DrillDownLevel.ASSET_CLASS],
        parentPath: []
      },
      {
        level: DrillDownLevel.ASSET_CLASS,
        children: [DrillDownLevel.SECURITY],
        parentPath: [DrillDownLevel.PORTFOLIO]
      },
      {
        level: DrillDownLevel.SECURITY,
        children: [],
        parentPath: [DrillDownLevel.PORTFOLIO, DrillDownLevel.ASSET_CLASS]
      }
    ]]
  ]);

  constructor() {
    this.eventPublisher = new EventPublisher();
  }

  async performDrillDown(
    request: DrillDownRequest,
    context: DrillDownContext
  ): Promise<DrillDownResponse> {
    try {
      logger.info('Performing drill-down analysis', {
        tenantId: context.tenantId,
        visualizationId: request.visualizationId,
        level: request.level,
        dataPointId: request.dataPointId
      });

      const visualization = await this.getVisualization(request.visualizationId);
      if (!visualization) {
        throw new Error('Visualization not found');
      }

      const parentDataPoint = visualization.data.find(dp => 
        dp.label === request.dataPointId || 
        dp.metadata?.id === request.dataPointId
      );

      if (!parentDataPoint) {
        throw new Error('Data point not found for drill-down');
      }

      const drillDownData = await this.generateDrillDownData(
        visualization.metricType,
        request.level,
        parentDataPoint,
        context,
        request.filters
      );

      const breadcrumb = this.generateBreadcrumb(
        visualization.metricType,
        request.level,
        parentDataPoint
      );

      const availableLevels = this.getAvailableLevels(
        visualization.metricType,
        request.level
      );

      await this.eventPublisher.publish('analytics.drill_down.performed', {
        tenantId: context.tenantId,
        visualizationId: request.visualizationId,
        level: request.level,
        dataPointId: request.dataPointId,
        resultCount: drillDownData.length
      });

      return {
        level: request.level,
        data: drillDownData,
        breadcrumb,
        availableLevels
      };

    } catch (error) {
      logger.error('Error performing drill-down:', error);
      throw error;
    }
  }

  async generateInteractiveDrillDown(
    metricType: AnalyticsMetricType,
    currentLevel: DrillDownLevel,
    parentValue: any,
    context: DrillDownContext
  ): Promise<AnalyticsDataPoint[]> {
    try {
      logger.info('Generating interactive drill-down', {
        metricType,
        currentLevel,
        parentValue
      });

      switch (currentLevel) {
        case DrillDownLevel.PORTFOLIO:
          return this.generatePortfolioDrillDown(metricType, context);
        case DrillDownLevel.ASSET_CLASS:
          return this.generateAssetClassDrillDown(metricType, parentValue, context);
        case DrillDownLevel.SECTOR:
          return this.generateSectorDrillDown(metricType, parentValue, context);
        case DrillDownLevel.INDUSTRY:
          return this.generateIndustryDrillDown(metricType, parentValue, context);
        case DrillDownLevel.SECURITY:
          return this.generateSecurityDrillDown(metricType, parentValue, context);
        case DrillDownLevel.POSITION:
          return this.generatePositionDrillDown(metricType, parentValue, context);
        default:
          throw new Error(`Unsupported drill-down level: ${currentLevel}`);
      }

    } catch (error) {
      logger.error('Error generating interactive drill-down:', error);
      throw error;
    }
  }

  private async generateDrillDownData(
    metricType: AnalyticsMetricType,
    level: DrillDownLevel,
    parentDataPoint: AnalyticsDataPoint,
    context: DrillDownContext,
    filters?: AnalyticsFilter[]
  ): Promise<AnalyticsDataPoint[]> {
    
    const hierarchyConfig = this.hierarchies.get(metricType);
    if (!hierarchyConfig) {
      throw new Error(`No drill-down hierarchy configured for metric type: ${metricType}`);
    }

    return this.generateInteractiveDrillDown(metricType, level, parentDataPoint.value, context);
  }

  private async generatePortfolioDrillDown(
    metricType: AnalyticsMetricType,
    context: DrillDownContext
  ): Promise<AnalyticsDataPoint[]> {
    
    const portfolios: AnalyticsDataPoint[] = [];
    const portfolioCount = context.portfolioIds?.length || 3;

    for (let i = 0; i < portfolioCount; i++) {
      const portfolioId = context.portfolioIds?.[i] || randomUUID();
      const baseValue = 1000000 + Math.random() * 2000000;
      
      portfolios.push({
        timestamp: new Date(),
        value: baseValue,
        label: `Portfolio ${i + 1}`,
        metadata: {
          id: portfolioId,
          type: 'portfolio',
          totalValue: baseValue,
          performance: (Math.random() * 20 - 10).toFixed(2) + '%',
          riskScore: (Math.random() * 10).toFixed(1),
          assetCount: Math.floor(Math.random() * 50) + 10,
          drillDownAvailable: true
        }
      });
    }

    return portfolios.sort((a, b) => b.value - a.value);
  }

  private async generateAssetClassDrillDown(
    metricType: AnalyticsMetricType,
    parentValue: any,
    context: DrillDownContext
  ): Promise<AnalyticsDataPoint[]> {
    
    const assetClasses = [
      { name: 'Equities', percentage: 0.65, risk: 'High' },
      { name: 'Fixed Income', percentage: 0.25, risk: 'Medium' },
      { name: 'Real Estate', percentage: 0.07, risk: 'Medium-High' },
      { name: 'Commodities', percentage: 0.02, risk: 'High' },
      { name: 'Cash & Equivalents', percentage: 0.01, risk: 'Low' }
    ];

    return assetClasses.map((assetClass, index) => {
      const value = typeof parentValue === 'number' ? 
        parentValue * assetClass.percentage : 
        Math.random() * 1000000 * assetClass.percentage;

      return {
        timestamp: new Date(),
        value,
        label: assetClass.name,
        metadata: {
          id: `asset_class_${index}`,
          type: 'asset_class',
          allocation: (assetClass.percentage * 100).toFixed(1) + '%',
          riskLevel: assetClass.risk,
          performance: (Math.random() * 30 - 15).toFixed(2) + '%',
          volatility: (Math.random() * 25 + 5).toFixed(1) + '%',
          drillDownAvailable: true
        }
      };
    });
  }

  private async generateSectorDrillDown(
    metricType: AnalyticsMetricType,
    parentValue: any,
    context: DrillDownContext
  ): Promise<AnalyticsDataPoint[]> {
    
    const sectors = [
      'Technology', 'Healthcare', 'Financial Services', 'Consumer Discretionary',
      'Industrials', 'Energy', 'Utilities', 'Materials', 'Telecommunications',
      'Consumer Staples', 'Real Estate Investment Trusts'
    ];

    return sectors.map((sector, index) => {
      const allocation = Math.random() * 0.25 + 0.02;
      const value = typeof parentValue === 'number' ? 
        parentValue * allocation : 
        Math.random() * 500000;

      return {
        timestamp: new Date(),
        value,
        label: sector,
        metadata: {
          id: `sector_${index}`,
          type: 'sector',
          allocation: (allocation * 100).toFixed(1) + '%',
          performance: (Math.random() * 40 - 20).toFixed(2) + '%',
          beta: (Math.random() * 1.5 + 0.5).toFixed(2),
          marketCap: this.formatMarketCap(Math.random() * 1000000000000),
          companyCount: Math.floor(Math.random() * 20) + 5,
          drillDownAvailable: true
        }
      };
    }).sort((a, b) => b.value - a.value);
  }

  private async generateIndustryDrillDown(
    metricType: AnalyticsMetricType,
    parentValue: any,
    context: DrillDownContext
  ): Promise<AnalyticsDataPoint[]> {
    
    const industries = [
      'Software', 'Semiconductors', 'Biotechnology', 'Banking',
      'Oil & Gas', 'Aerospace & Defense', 'Retail', 'Insurance',
      'Pharmaceuticals', 'Automotive', 'Construction', 'Food & Beverage'
    ];

    return industries.slice(0, 8).map((industry, index) => {
      const allocation = Math.random() * 0.15 + 0.01;
      const value = typeof parentValue === 'number' ? 
        parentValue * allocation : 
        Math.random() * 200000;

      return {
        timestamp: new Date(),
        value,
        label: industry,
        metadata: {
          id: `industry_${index}`,
          type: 'industry',
          allocation: (allocation * 100).toFixed(1) + '%',
          performance: (Math.random() * 50 - 25).toFixed(2) + '%',
          peRatio: (Math.random() * 30 + 5).toFixed(1),
          growthRate: (Math.random() * 20 + 2).toFixed(1) + '%',
          companyCount: Math.floor(Math.random() * 15) + 3,
          drillDownAvailable: true
        }
      };
    }).sort((a, b) => b.value - a.value);
  }

  private async generateSecurityDrillDown(
    metricType: AnalyticsMetricType,
    parentValue: any,
    context: DrillDownContext
  ): Promise<AnalyticsDataPoint[]> {
    
    const securities = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      { symbol: 'META', name: 'Meta Platforms Inc.' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.' }
    ];

    return securities.map((security, index) => {
      const allocation = Math.random() * 0.08 + 0.005;
      const value = typeof parentValue === 'number' ? 
        parentValue * allocation : 
        Math.random() * 100000;
      
      const price = Math.random() * 500 + 20;
      const shares = Math.floor(value / price);

      return {
        timestamp: new Date(),
        value,
        label: `${security.symbol} - ${security.name}`,
        metadata: {
          id: `security_${security.symbol}`,
          type: 'security',
          symbol: security.symbol,
          name: security.name,
          shares: shares,
          price: price.toFixed(2),
          marketValue: value.toFixed(2),
          allocation: (allocation * 100).toFixed(2) + '%',
          performance: (Math.random() * 60 - 30).toFixed(2) + '%',
          beta: (Math.random() * 2 + 0.3).toFixed(2),
          peRatio: (Math.random() * 40 + 5).toFixed(1),
          dividendYield: (Math.random() * 5).toFixed(2) + '%',
          drillDownAvailable: true
        }
      };
    }).sort((a, b) => b.value - a.value);
  }

  private async generatePositionDrillDown(
    metricType: AnalyticsMetricType,
    parentValue: any,
    context: DrillDownContext
  ): Promise<AnalyticsDataPoint[]> {
    
    return [
      {
        timestamp: new Date(),
        value: parentValue,
        label: 'Current Position',
        metadata: {
          id: 'current_position',
          type: 'position',
          quantity: Math.floor(Math.random() * 1000),
          averageCost: (Math.random() * 200 + 50).toFixed(2),
          currentPrice: (Math.random() * 250 + 60).toFixed(2),
          unrealizedGainLoss: (Math.random() * 20000 - 10000).toFixed(2),
          unrealizedGainLossPercent: (Math.random() * 40 - 20).toFixed(2) + '%',
          acquisitionDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          taxLot: 'Long-term',
          drillDownAvailable: false
        }
      }
    ];
  }

  private generateBreadcrumb(
    metricType: AnalyticsMetricType,
    currentLevel: DrillDownLevel,
    dataPoint: AnalyticsDataPoint
  ): DrillDownResponse['breadcrumb'] {
    
    const hierarchy = this.hierarchies.get(metricType);
    if (!hierarchy) {
      return [{ level: currentLevel, label: dataPoint.label || 'Unknown', value: dataPoint.value }];
    }

    const currentHierarchy = hierarchy.find(h => h.level === currentLevel);
    if (!currentHierarchy) {
      return [{ level: currentLevel, label: dataPoint.label || 'Unknown', value: dataPoint.value }];
    }

    const breadcrumb: DrillDownResponse['breadcrumb'] = [];
    
    currentHierarchy.parentPath.forEach((level, index) => {
      breadcrumb.push({
        level,
        label: this.getLevelDisplayName(level),
        value: index === 0 ? 'Total' : 'Parent'
      });
    });

    breadcrumb.push({
      level: currentLevel,
      label: dataPoint.label || 'Current',
      value: dataPoint.value
    });

    return breadcrumb;
  }

  private getAvailableLevels(
    metricType: AnalyticsMetricType,
    currentLevel: DrillDownLevel
  ): DrillDownLevel[] {
    
    const hierarchy = this.hierarchies.get(metricType);
    if (!hierarchy) {
      return [];
    }

    const currentHierarchy = hierarchy.find(h => h.level === currentLevel);
    return currentHierarchy?.children || [];
  }

  private getLevelDisplayName(level: DrillDownLevel): string {
    const displayNames: Record<DrillDownLevel, string> = {
      [DrillDownLevel.PORTFOLIO]: 'Portfolio',
      [DrillDownLevel.ASSET_CLASS]: 'Asset Class',
      [DrillDownLevel.SECTOR]: 'Sector',
      [DrillDownLevel.INDUSTRY]: 'Industry',
      [DrillDownLevel.SECURITY]: 'Security',
      [DrillDownLevel.POSITION]: 'Position'
    };

    return displayNames[level] || level;
  }

  private formatMarketCap(value: number): string {
    if (value >= 1e12) {
      return (value / 1e12).toFixed(1) + 'T';
    } else if (value >= 1e9) {
      return (value / 1e9).toFixed(1) + 'B';
    } else if (value >= 1e6) {
      return (value / 1e6).toFixed(1) + 'M';
    } else {
      return value.toFixed(0);
    }
  }

  async getVisualization(visualizationId: string): Promise<any> {
    logger.debug('Retrieving visualization for drill-down', { visualizationId });
    
    return {
      id: visualizationId,
      metricType: AnalyticsMetricType.PORTFOLIO_PERFORMANCE,
      data: [
        {
          timestamp: new Date(),
          value: 1500000,
          label: 'Sample Data Point',
          metadata: { id: 'sample_1' }
        }
      ]
    };
  }

  validateDrillDownLevel(
    metricType: AnalyticsMetricType,
    level: DrillDownLevel,
    currentPath: DrillDownLevel[]
  ): boolean {
    const hierarchy = this.hierarchies.get(metricType);
    if (!hierarchy) {
      return false;
    }

    return hierarchy.some(h => h.level === level && 
      h.parentPath.every((parent, index) => currentPath[index] === parent)
    );
  }

  getMaxDrillDepth(metricType: AnalyticsMetricType): number {
    const hierarchy = this.hierarchies.get(metricType);
    if (!hierarchy) {
      return 0;
    }

    return Math.max(...hierarchy.map(h => h.parentPath.length + 1));
  }
}
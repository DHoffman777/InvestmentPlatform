// Barrier Monitoring Service
// Phase 4.1 - Real-time barrier monitoring and alerting for structured products

import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../../utils/kafka-mock';
import { logger } from '../../utils/logger';
import {
  StructuredProduct,
  BarrierFeature,
  BarrierAlert,
  BarrierStatus,
  BarrierMonitoringRequest,
  BarrierMonitoringResponse,
  BarrierType,
  ObservationFrequency,
  UnderlyingAsset
} from '../../models/structuredProducts/StructuredProducts';

export class BarrierMonitoringService {
  constructor(
    private prisma: PrismaClient,
    private kafkaService: ReturnType<typeof getKafkaService>
  ) {}

  // Monitor barriers for given products or portfolios
  async monitorBarriers(
    request: BarrierMonitoringRequest
  ): Promise<BarrierMonitoringResponse> {
    try {
      logger.info('Starting barrier monitoring', {
        productIds: request.productIds?.length || 'all',
        portfolioIds: request.portfolioIds?.length || 'all',
        alertThreshold: request.alertThreshold || 0.1
      });

      // Get products to monitor
      const products = await this.getProductsToMonitor(request);
      
      // Get current market data
      const marketData = await this.getCurrentMarketData(products);
      
      // Process barriers for each product
      const activeBarriers: BarrierStatus[] = [];
      const alerts: BarrierAlert[] = [];
      let totalBarriers = 0;
      let hitBarriers = 0;
      let approachingBarriers = 0;

      for (const product of products) {
        if (product.hasBarrier && product.barriers) {
          for (const barrier of product.barriers) {
            if (barrier.isActive) {
              totalBarriers++;

              const barrierStatus = await this.evaluateBarrier(
                product,
                barrier,
                marketData,
                request.alertThreshold || 0.1
              );

              activeBarriers.push(barrierStatus);

              if (barrierStatus.hasBeenHit) {
                hitBarriers++;
              } else if (barrierStatus.isApproaching) {
                approachingBarriers++;
              }

              // Generate alerts if needed
              const barrierAlerts = await this.generateBarrierAlerts(
                product,
                barrier,
                barrierStatus,
                request.alertThreshold || 0.1
              );

              alerts.push(...barrierAlerts);
            }
          }
        }
      }

      // Store monitoring results
      await this.storeMonitoringResults(activeBarriers, alerts);

      // Publish alerts
      for (const alert of alerts.filter(a => a.isActive)) {
        await this.publishBarrierAlert(alert);
      }

      const response: BarrierMonitoringResponse = {
        monitoringDate: new Date(),
        activeBarriers,
        alerts: alerts.filter(a => a.isActive),
        summary: {
          totalBarriers,
          activeBarriers: totalBarriers - hitBarriers,
          approachingBarriers,
          hitBarriers
        }
      };

      logger.info('Barrier monitoring completed', {
        totalBarriers,
        activeBarriers: totalBarriers - hitBarriers,
        approachingBarriers,
        hitBarriers,
        newAlerts: alerts.filter(a => a.isActive).length
      });

      return response;

    } catch (error) {
      logger.error('Error in barrier monitoring:', error);
      throw error;
    }
  }

  // Get products to monitor based on request criteria
  private async getProductsToMonitor(
    request: BarrierMonitoringRequest
  ): Promise<StructuredProduct[]> {
    try {
      // In a real implementation, this would query the database
      // For now, return mock data
      const mockProducts: StructuredProduct[] = [
        {
          id: 'sp_001',
          tenantId: 'tenant_001',
          instrumentId: 'inst_sp_001',
          productName: 'AAPL Barrier Note',
          productType: 'STRUCTURED_NOTE' as any,
          issuer: 'Bank ABC',
          issuerId: 'issuer_001',
          notionalAmount: 1000000,
          currency: 'USD',
          issueDate: new Date('2024-01-01'),
          maturityDate: new Date('2026-01-01'),
          minInvestment: 10000,
          payoffType: 'PARTICIPATION' as any,
          payoffFormula: 'max(0, participation * (finalLevel / initialLevel - 1))',
          payoffParameters: { participation: 1.0 },
          underlyingType: 'SINGLE_STOCK' as any,
          underlyingAssets: [
            {
              id: 'underlying_001',
              symbol: 'AAPL',
              name: 'Apple Inc.',
              assetType: 'EQUITY',
              weight: 100,
              currentPrice: 150,
              initialLevel: 140,
              strikeLevel: 140
            }
          ],
          hasBarrier: true,
          barriers: [
            {
              id: 'barrier_001',
              barrierType: 'DOWN_AND_OUT' as any,
              level: 98, // $98 absolute level
              observationFrequency: 'DAILY' as any,
              observationStartDate: new Date('2024-01-01'),
              observationEndDate: new Date('2026-01-01'),
              isAmerican: true,
              isActive: true,
              hasBeenHit: false
            },
            {
              id: 'barrier_002',
              barrierType: 'UP_AND_OUT' as any,
              level: 200, // $200 absolute level
              observationFrequency: 'DAILY' as any,
              observationStartDate: new Date('2024-01-01'),
              observationEndDate: new Date('2026-01-01'),
              isAmerican: true,
              isActive: true,
              hasBeenHit: false
            }
          ],
          hasCoupon: false,
          isCallable: false,
          isPutable: false,
          hasCapitalProtection: false,
          settlementType: 'CASH' as any,
          settlementDays: 3,
          termSheet: '{}',
          riskLevel: 'HIGH' as any,
          riskFactors: ['Market Risk', 'Credit Risk', 'Barrier Risk'],
          status: 'ACTIVE' as any,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          updatedBy: 'system'
        }
      ];

      // Filter based on request criteria
      let filteredProducts = mockProducts;

      if (request.productIds && request.productIds.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          request.productIds!.includes(p.id)
        );
      }

      // In a real implementation, would also filter by portfolioIds
      // by checking which products are held in specified portfolios

      return filteredProducts.filter(p => p.hasBarrier);

    } catch (error) {
      logger.error('Error getting products to monitor:', error);
      throw error;
    }
  }

  // Get current market data for underlying assets
  private async getCurrentMarketData(
    products: StructuredProduct[]
  ): Promise<Record<string, { price: number; timestamp: Date }>> {
    try {
      const marketData: Record<string, { price: number; timestamp: Date }> = {};
      
      // Collect all unique underlying symbols
      const symbols = new Set<string>();
      for (const product of products) {
        for (const underlying of product.underlyingAssets) {
          symbols.add(underlying.symbol);
        }
      }

      // In a real implementation, this would fetch from market data service
      // For now, return mock data
      for (const symbol of symbols) {
        marketData[symbol] = {
          price: this.getMockPrice(symbol),
          timestamp: new Date()
        };
      }

      return marketData;

    } catch (error) {
      logger.error('Error getting market data:', error);
      throw error;
    }
  }

  // Mock price generation for testing
  private getMockPrice(symbol: string): number {
    const basePrices: Record<string, number> = {
      'AAPL': 150,
      'MSFT': 300,
      'GOOGL': 2500,
      'TSLA': 200,
      'NVDA': 800
    };

    const basePrice = basePrices[symbol] || 100;
    // Add some random variation
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    return basePrice * (1 + variation);
  }

  // Evaluate a single barrier
  private async evaluateBarrier(
    product: StructuredProduct,
    barrier: BarrierFeature,
    marketData: Record<string, { price: number; timestamp: Date }>,
    alertThreshold: number
  ): Promise<BarrierStatus> {
    try {
      // Get underlying asset for this barrier
      const underlying = product.underlyingAssets[0]; // Simplified for single underlying
      const currentMarketData = marketData[underlying.symbol];
      
      if (!currentMarketData) {
        throw new Error(`No market data available for ${underlying.symbol}`);
      }

      const currentLevel = currentMarketData.price;
      let barrierLevel: number;
      
      // Determine barrier level based on barrier type and level specification
      if (barrier.level < 10) {
        // Percentage of initial level
        barrierLevel = (underlying.initialLevel || underlying.currentPrice || currentLevel) * barrier.level;
      } else {
        // Absolute level
        barrierLevel = barrier.level;
      }

      // Calculate distance to barrier
      let distance: number;
      let distancePercentage: number;
      let isApproaching = false;

      switch (barrier.barrierType) {
        case 'DOWN_AND_OUT':
        case 'DOWN_AND_IN':
          distance = currentLevel - barrierLevel;
          distancePercentage = (distance / currentLevel) * 100;
          isApproaching = distancePercentage <= alertThreshold * 100 && distance > 0;
          break;

        case 'UP_AND_OUT':
        case 'UP_AND_IN':
          distance = barrierLevel - currentLevel;
          distancePercentage = (distance / currentLevel) * 100;
          isApproaching = distancePercentage <= alertThreshold * 100 && distance > 0;
          break;

        default:
          distance = Math.abs(currentLevel - barrierLevel);
          distancePercentage = (distance / currentLevel) * 100;
          isApproaching = distancePercentage <= alertThreshold * 100;
      }

      // Check if barrier has been hit
      const hasBeenHit = this.checkBarrierHit(
        barrier.barrierType,
        currentLevel,
        barrierLevel
      );

      // Update barrier status if hit
      if (hasBeenHit && !barrier.hasBeenHit) {
        await this.updateBarrierHitStatus(barrier.id, currentLevel);
      }

      return {
        productId: product.id,
        productName: product.productName,
        barrierId: barrier.id,
        barrierType: barrier.barrierType,
        barrierLevel,
        currentLevel,
        distance: Math.abs(distance),
        distancePercentage: Math.abs(distancePercentage),
        isApproaching,
        hasBeenHit: hasBeenHit || barrier.hasBeenHit,
        hitDate: barrier.hitDate
      };

    } catch (error) {
      logger.error('Error evaluating barrier:', { barrierId: barrier.id, error });
      throw error;
    }
  }

  // Check if barrier has been hit
  private checkBarrierHit(
    barrierType: BarrierType,
    currentLevel: number,
    barrierLevel: number
  ): boolean {
    switch (barrierType) {
      case 'DOWN_AND_OUT':
      case 'DOWN_AND_IN':
        return currentLevel <= barrierLevel;

      case 'UP_AND_OUT':
      case 'UP_AND_IN':
        return currentLevel >= barrierLevel;

      case 'KNOCK_IN':
        return currentLevel <= barrierLevel;

      case 'KNOCK_OUT':
        return currentLevel <= barrierLevel;

      default:
        return false;
    }
  }

  // Generate alerts for barriers
  private async generateBarrierAlerts(
    product: StructuredProduct,
    barrier: BarrierFeature,
    status: BarrierStatus,
    alertThreshold: number
  ): Promise<BarrierAlert[]> {
    const alerts: BarrierAlert[] = [];

    try {
      // Check for barrier hit alert
      if (status.hasBeenHit && !barrier.hasBeenHit) {
        alerts.push({
          id: `alert_hit_${barrier.id}_${Date.now()}`,
          barrierId: barrier.id,
          alertType: 'BARRIER_HIT',
          severity: 'CRITICAL',
          currentLevel: status.currentLevel,
          barrierLevel: status.barrierLevel,
          distance: status.distance,
          distancePercentage: status.distancePercentage,
          alertTime: new Date(),
          isActive: true
        });
      }

      // Check for barrier approach alert
      if (status.isApproaching && !status.hasBeenHit) {
        const severity = this.calculateAlertSeverity(status.distancePercentage, alertThreshold);
        
        alerts.push({
          id: `alert_approach_${barrier.id}_${Date.now()}`,
          barrierId: barrier.id,
          alertType: 'BARRIER_APPROACH',
          severity,
          currentLevel: status.currentLevel,
          barrierLevel: status.barrierLevel,
          distance: status.distance,
          distancePercentage: status.distancePercentage,
          alertTime: new Date(),
          isActive: true
        });
      }

      // Check for barrier recovery alert (if previously hit and now recovered)
      if (!status.hasBeenHit && barrier.hasBeenHit && this.isRecoveryScenario(barrier.barrierType)) {
        alerts.push({
          id: `alert_recovery_${barrier.id}_${Date.now()}`,
          barrierId: barrier.id,
          alertType: 'BARRIER_RECOVERY',
          severity: 'MEDIUM',
          currentLevel: status.currentLevel,
          barrierLevel: status.barrierLevel,
          distance: status.distance,
          distancePercentage: status.distancePercentage,
          alertTime: new Date(),
          isActive: true
        });
      }

      return alerts;

    } catch (error) {
      logger.error('Error generating barrier alerts:', error);
      return [];
    }
  }

  // Calculate alert severity based on distance to barrier
  private calculateAlertSeverity(
    distancePercentage: number,
    alertThreshold: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const normalizedDistance = distancePercentage / (alertThreshold * 100);
    
    if (normalizedDistance <= 0.25) {
      return 'CRITICAL';
    } else if (normalizedDistance <= 0.5) {
      return 'HIGH';
    } else if (normalizedDistance <= 0.75) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  // Check if barrier type supports recovery scenarios
  private isRecoveryScenario(barrierType: BarrierType): boolean {
    // Some barrier types (like American knock-out) cannot recover once hit
    // Others (like European barriers observed only at maturity) can recover
    return barrierType.includes('EUROPEAN') || !barrierType.includes('OUT');
  }

  // Update barrier hit status in database
  private async updateBarrierHitStatus(
    barrierId: string,
    hitLevel: number
  ): Promise<void> {
    try {
      // In a real implementation, this would update the database
      logger.info('Barrier hit detected', {
        barrierId,
        hitLevel,
        hitTime: new Date()
      });
    } catch (error) {
      logger.error('Error updating barrier hit status:', error);
    }
  }

  // Store monitoring results
  private async storeMonitoringResults(
    barrierStatuses: BarrierStatus[],
    alerts: BarrierAlert[]
  ): Promise<void> {
    try {
      // In a real implementation, this would store in database
      logger.debug('Storing monitoring results', {
        barrierCount: barrierStatuses.length,
        alertCount: alerts.length
      });
    } catch (error) {
      logger.error('Error storing monitoring results:', error);
    }
  }

  // Publish barrier alert to Kafka
  private async publishBarrierAlert(alert: BarrierAlert): Promise<void> {
    try {
      await this.kafkaService.publishEvent('structured-products.barrier.alert', {
        alertId: alert.id,
        barrierId: alert.barrierId,
        alertType: alert.alertType,
        severity: alert.severity,
        currentLevel: alert.currentLevel,
        barrierLevel: alert.barrierLevel,
        distance: alert.distance,
        distancePercentage: alert.distancePercentage,
        alertTime: alert.alertTime.toISOString()
      });

      logger.info('Barrier alert published', {
        alertId: alert.id,
        alertType: alert.alertType,
        severity: alert.severity
      });

    } catch (error) {
      logger.error('Error publishing barrier alert:', error);
    }
  }

  // Real-time barrier monitoring (called periodically)
  async performRealTimeMonitoring(
    intervalMinutes: number = 5
  ): Promise<void> {
    logger.info('Starting real-time barrier monitoring', { intervalMinutes });

    const monitor = async () => {
      try {
        const request: BarrierMonitoringRequest = {
          alertThreshold: 0.05 // 5% alert threshold
        };

        const result = await this.monitorBarriers(request);
        
        logger.debug('Real-time monitoring cycle completed', {
          totalBarriers: result.summary.totalBarriers,
          newAlerts: result.alerts.length
        });

      } catch (error) {
        logger.error('Error in real-time monitoring cycle:', error);
      }
    };

    // Initial monitoring
    await monitor();

    // Set up periodic monitoring
    setInterval(monitor, intervalMinutes * 60 * 1000);
  }

  // Get barrier history for a product
  async getBarrierHistory(
    productId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    product: StructuredProduct;
    barrierEvents: {
      barrierId: string;
      eventType: 'HIT' | 'APPROACH' | 'RECOVERY';
      eventTime: Date;
      level: number;
      distance: number;
    }[];
  }> {
    try {
      // In a real implementation, this would query historical data
      const product = await this.getProductsToMonitor({ productIds: [productId] });
      
      if (product.length === 0) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Mock barrier events for demonstration
      const barrierEvents = [
        {
          barrierId: 'barrier_001',
          eventType: 'APPROACH' as const,
          eventTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          level: 102,
          distance: 4
        },
        {
          barrierId: 'barrier_001',
          eventType: 'RECOVERY' as const,
          eventTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          level: 108,
          distance: 10
        }
      ];

      return {
        product: product[0],
        barrierEvents
      };

    } catch (error) {
      logger.error('Error getting barrier history:', error);
      throw error;
    }
  }

  // Calculate barrier breach probability using statistical models
  async calculateBreachProbability(
    productId: string,
    timeHorizonDays: number,
    confidenceLevel: number = 0.95
  ): Promise<{
    productId: string;
    timeHorizonDays: number;
    barrierProbabilities: {
      barrierId: string;
      barrierType: BarrierType;
      breachProbability: number;
      timeToBreachDays?: number;
      confidenceInterval: {
        lower: number;
        upper: number;
      };
    }[];
  }> {
    try {
      const products = await this.getProductsToMonitor({ productIds: [productId] });
      
      if (products.length === 0) {
        throw new Error(`Product not found: ${productId}`);
      }

      const product = products[0];
      const marketData = await this.getCurrentMarketData([product]);
      const underlying = product.underlyingAssets[0];
      const currentPrice = marketData[underlying.symbol].price;

      // Estimate volatility (in a real implementation, this would use historical data)
      const estimatedVolatility = 0.25; // 25% annualized volatility

      const barrierProbabilities = product.barriers?.map(barrier => {
        // Calculate probability using geometric Brownian motion
        const barrierLevel = barrier.level < 10 
          ? (underlying.initialLevel || currentPrice) * barrier.level
          : barrier.level;

        const timeToMaturity = timeHorizonDays / 365.25;
        const drift = 0.05; // Assumed risk-free rate
        
        // Calculate breach probability using barrier option formulas
        const mu = Math.log(barrierLevel / currentPrice);
        const sigma = estimatedVolatility * Math.sqrt(timeToMaturity);
        
        let breachProbability: number;
        
        if (barrier.barrierType.includes('DOWN')) {
          // Probability of hitting lower barrier
          const d = mu / sigma;
          breachProbability = this.cumulativeNormalDistribution(d);
        } else {
          // Probability of hitting upper barrier
          const d = mu / sigma;
          breachProbability = 1 - this.cumulativeNormalDistribution(d);
        }

        // Calculate confidence interval
        const margin = 1.96 * Math.sqrt(breachProbability * (1 - breachProbability) / 1000);
        
        return {
          barrierId: barrier.id,
          barrierType: barrier.barrierType,
          breachProbability: Math.max(0, Math.min(1, breachProbability)),
          confidenceInterval: {
            lower: Math.max(0, breachProbability - margin),
            upper: Math.min(1, breachProbability + margin)
          }
        };
      }) || [];

      return {
        productId,
        timeHorizonDays,
        barrierProbabilities
      };

    } catch (error) {
      logger.error('Error calculating breach probability:', error);
      throw error;
    }
  }

  // Utility function for normal distribution
  private cumulativeNormalDistribution(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  // Get barrier monitoring dashboard data
  async getBarrierDashboard(
    tenantId: string
  ): Promise<{
    summary: {
      totalProducts: number;
      activeBarriers: number;
      approachingBarriers: number;
      hitBarriers: number;
      criticalAlerts: number;
    };
    recentAlerts: BarrierAlert[];
    topRiskProducts: {
      productId: string;
      productName: string;
      riskScore: number;
      closestBarrierDistance: number;
    }[];
    barrierTypesBreakdown: Record<BarrierType, number>;
  }> {
    try {
      // Get all products for tenant
      const request: BarrierMonitoringRequest = { alertThreshold: 0.1 };
      const monitoringResult = await this.monitorBarriers(request);

      // Calculate risk scores for products
      const productRiskScores = new Map<string, {
        productName: string;
        riskScore: number;
        closestBarrierDistance: number;
      }>();

      for (const barrier of monitoringResult.activeBarriers) {
        const riskScore = this.calculateRiskScore(barrier);
        const existing = productRiskScores.get(barrier.productId);
        
        if (!existing || riskScore > existing.riskScore) {
          productRiskScores.set(barrier.productId, {
            productName: barrier.productName,
            riskScore,
            closestBarrierDistance: barrier.distancePercentage
          });
        }
      }

      // Get top 5 riskiest products
      const topRiskProducts = Array.from(productRiskScores.entries())
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5);

      // Count barrier types
      const barrierTypesBreakdown = monitoringResult.activeBarriers
        .reduce((acc, barrier) => {
          acc[barrier.barrierType] = (acc[barrier.barrierType] || 0) + 1;
          return acc;
        }, {} as Record<BarrierType, number>);

      // Recent alerts (last 24 hours)
      const recentAlerts = monitoringResult.alerts.filter(
        alert => Date.now() - alert.alertTime.getTime() < 24 * 60 * 60 * 1000
      );

      return {
        summary: {
          totalProducts: new Set(monitoringResult.activeBarriers.map(b => b.productId)).size,
          activeBarriers: monitoringResult.summary.activeBarriers,
          approachingBarriers: monitoringResult.summary.approachingBarriers,
          hitBarriers: monitoringResult.summary.hitBarriers,
          criticalAlerts: monitoringResult.alerts.filter(a => a.severity === 'CRITICAL').length
        },
        recentAlerts,
        topRiskProducts,
        barrierTypesBreakdown
      };

    } catch (error) {
      logger.error('Error getting barrier dashboard:', error);
      throw error;
    }
  }

  // Calculate risk score for a barrier
  private calculateRiskScore(barrier: BarrierStatus): number {
    let riskScore = 0;

    // Distance-based risk (closer = higher risk)
    if (barrier.distancePercentage <= 2) {
      riskScore += 50;
    } else if (barrier.distancePercentage <= 5) {
      riskScore += 30;
    } else if (barrier.distancePercentage <= 10) {
      riskScore += 15;
    }

    // Barrier type risk
    if (barrier.barrierType.includes('OUT')) {
      riskScore += 20; // Knock-out barriers are riskier
    }

    // Approach trend (would need historical data)
    if (barrier.isApproaching) {
      riskScore += 25;
    }

    return Math.min(100, riskScore);
  }
}
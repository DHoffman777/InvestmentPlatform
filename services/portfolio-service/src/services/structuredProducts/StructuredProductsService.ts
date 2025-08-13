// Structured Products Service
// Phase 4.1 - Main orchestration service for structured products functionality

import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../../utils/kafka-mock';
import { logger } from '../../utils/logger';
import {
  StructuredProduct,
  CreateStructuredProductRequest,
  StructuredProductSearchRequest,
  StructuredProductSearchResponse,
  StructuredProductValuationRequest,
  StructuredProductValuationResponse,
  BarrierMonitoringRequest,
  BarrierMonitoringResponse,
  StructuredProductPosition,
  IssuerCreditRisk,
  StructuredProductType,
  DocumentStatus
} from '../../models/structuredProducts/StructuredProducts';

import { StructuredProductsValuationService } from './StructuredProductsValuationService';
import { BarrierMonitoringService } from './BarrierMonitoringService';
import { DocumentParsingService } from './DocumentParsingService';

export class StructuredProductsService {
  private valuationService: StructuredProductsValuationService;
  private barrierMonitoringService: BarrierMonitoringService;
  private documentParsingService: DocumentParsingService;

  constructor(
    private prisma: PrismaClient,
    private kafkaService: ReturnType<typeof getKafkaService>
  ) {
    this.valuationService = new StructuredProductsValuationService(prisma, kafkaService);
    this.barrierMonitoringService = new BarrierMonitoringService(prisma, kafkaService);
    this.documentParsingService = new DocumentParsingService(prisma, kafkaService);
  }

  // Create a new structured product
  async createProduct(
    request: CreateStructuredProductRequest,
    tenantId: string,
    userId: string
  ): Promise<StructuredProduct> {
    try {
      logger.info('Creating structured product', {
        productName: request.productData.productName,
        productType: request.productData.productType,
        tenantId,
        userId
      });

      // Validate request data
      await this.validateProductData(request);

      // Generate unique IDs
      const productId = `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const instrumentId = `inst_${productId}`;

      // Create main product record
      const product: StructuredProduct = {
        ...request.productData,
        id: productId,
        tenantId,
        instrumentId,
        underlyingAssets: request.underlyingAssets.map((asset, index) => ({
          ...asset,
          id: `underlying_${productId}_${index + 1}`
        })),
        barriers: request.barriers?.map((barrier, index) => ({
          ...barrier,
          id: `barrier_${productId}_${index + 1}`
        })),
        coupons: request.coupons?.map((coupon, index) => ({
          ...coupon,
          id: `coupon_${productId}_${index + 1}`
        })),
        callSchedule: request.callSchedule?.map((call, index) => ({
          ...call,
          id: `call_${productId}_${index + 1}`
        })),
        putSchedule: request.putSchedule?.map((put, index) => ({
          ...put,
          id: `put_${productId}_${index + 1}`
        })),
        status: 'DRAFT',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId
      };

      // Store in database
      await this.storeProduct(product);

      // Perform initial valuation
      try {
        const initialValuation = await this.valuationService.valuateProduct({
          productId: product.id,
          valuationDate: new Date(),
          modelType: 'MONTE_CARLO',
          includeGreeks: true
        });

        product.currentPrice = initialValuation.theoreticalValue / product.notionalAmount;
        product.lastPriceUpdate = new Date();
      } catch (valuationError) {
        logger.warn('Initial valuation failed', { productId, error: valuationError });
      }

      // Set up barrier monitoring if applicable
      if (product.hasBarrier) {
        await this.setupBarrierMonitoring(product);
      }

      // Assess issuer credit risk
      await this.assessIssuerCreditRisk(product.issuerId, tenantId);

      // Publish product creation event
      await this.publishProductEvent('CREATED', product);

      logger.info('Structured product created successfully', {
        productId: product.id,
        productName: product.productName,
        notionalAmount: product.notionalAmount
      });

      return product;

    } catch (error) {
      logger.error('Error creating structured product:', error);
      throw error;
    }
  }

  // Get structured product by ID
  async getProduct(
    productId: string,
    tenantId: string
  ): Promise<StructuredProduct | null> {
    try {
      // In a real implementation, this would query the database
      return await this.loadProduct(productId, tenantId);
    } catch (error) {
      logger.error('Error retrieving structured product:', error);
      return null;
    }
  }

  // Update structured product
  async updateProduct(
    productId: string,
    updates: Partial<StructuredProduct>,
    tenantId: string,
    userId: string
  ): Promise<StructuredProduct> {
    try {
      logger.info('Updating structured product', { productId, tenantId, userId });

      // Load existing product
      const existingProduct = await this.loadProduct(productId, tenantId);
      if (!existingProduct) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Validate update permissions
      await this.validateUpdatePermissions(existingProduct, updates, userId);

      // Apply updates
      const updatedProduct: StructuredProduct = {
        ...existingProduct,
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId
      };

      // Store updated product
      await this.storeProduct(updatedProduct);

      // Trigger revaluation if significant changes
      if (this.requiresRevaluation(updates)) {
        await this.triggerRevaluation(updatedProduct);
      }

      // Update barrier monitoring if barriers changed
      if (updates.barriers || updates.hasBarrier !== undefined) {
        await this.updateBarrierMonitoring(updatedProduct);
      }

      // Publish update event
      await this.publishProductEvent('UPDATED', updatedProduct);

      logger.info('Structured product updated successfully', { productId });
      return updatedProduct;

    } catch (error) {
      logger.error('Error updating structured product:', error);
      throw error;
    }
  }

  // Search structured products
  async searchProducts(
    request: StructuredProductSearchRequest
  ): Promise<StructuredProductSearchResponse> {
    try {
      logger.info('Searching structured products', {
        tenantId: request.tenantId,
        filters: {
          productTypes: request.productTypes?.length || 0,
          issuers: request.issuers?.length || 0,
          hasMaturityRange: !!request.maturityDateRange
        }
      });

      // In a real implementation, this would build and execute database queries
      const mockProducts = await this.getMockProducts(request.tenantId);

      // Apply filters
      let filteredProducts = mockProducts;

      if (request.productTypes && request.productTypes.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          request.productTypes!.includes(p.productType)
        );
      }

      if (request.issuers && request.issuers.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          request.issuers!.includes(p.issuer)
        );
      }

      if (request.hasBarrier !== undefined) {
        filteredProducts = filteredProducts.filter(p => 
          p.hasBarrier === request.hasBarrier
        );
      }

      if (request.riskLevels && request.riskLevels.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          request.riskLevels!.includes(p.riskLevel)
        );
      }

      // Apply pagination
      const offset = request.offset || 0;
      const limit = request.limit || 50;
      const total = filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(offset, offset + limit);

      // Calculate aggregations
      const aggregations = {
        byProductType: this.aggregateByField(filteredProducts, 'productType'),
        byIssuer: this.aggregateByField(filteredProducts, 'issuer'),
        byRiskLevel: this.aggregateByField(filteredProducts, 'riskLevel'),
        averageMaturity: this.calculateAverageMaturity(filteredProducts),
        totalNotional: filteredProducts.reduce((sum, p) => sum + p.notionalAmount, 0)
      };

      const response: StructuredProductSearchResponse = {
        products: paginatedProducts,
        total,
        aggregations,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };

      logger.info('Product search completed', {
        totalResults: total,
        returnedResults: paginatedProducts.length
      });

      return response;

    } catch (error) {
      logger.error('Error searching structured products:', error);
      throw error;
    }
  }

  // Valuate structured product
  async valuateProduct(
    request: StructuredProductValuationRequest
  ): Promise<StructuredProductValuationResponse> {
    try {
      return await this.valuationService.valuateProduct(request);
    } catch (error) {
      logger.error('Error in product valuation:', error);
      throw error;
    }
  }

  // Monitor barriers
  async monitorBarriers(
    request: BarrierMonitoringRequest
  ): Promise<BarrierMonitoringResponse> {
    try {
      return await this.barrierMonitoringService.monitorBarriers(request);
    } catch (error) {
      logger.error('Error in barrier monitoring:', error);
      throw error;
    }
  }

  // Parse document
  async parseDocument(
    documentId: string,
    documentPath: string,
    documentType: 'TERM_SHEET' | 'PROSPECTUS' | 'MARKETING' | 'LEGAL',
    tenantId: string
  ) {
    try {
      return await this.documentParsingService.parseDocument(
        documentId,
        documentPath,
        documentType,
        tenantId
      );
    } catch (error) {
      logger.error('Error parsing document:', error);
      throw error;
    }
  }

  // Create product position
  async createPosition(
    productId: string,
    portfolioId: string,
    quantity: number,
    acquisitionPrice: number,
    tenantId: string,
    userId: string
  ): Promise<StructuredProductPosition> {
    try {
      logger.info('Creating structured product position', {
        productId,
        portfolioId,
        quantity,
        acquisitionPrice,
        tenantId
      });

      // Validate product exists
      const product = await this.loadProduct(productId, tenantId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Check minimum investment requirements
      const notionalValue = quantity * product.notionalAmount;
      if (notionalValue < product.minInvestment) {
        throw new Error(`Investment below minimum: ${notionalValue} < ${product.minInvestment}`);
      }

      // Create position
      const positionId = `pos_${productId}_${portfolioId}_${Date.now()}`;
      const position: StructuredProductPosition = {
        id: positionId,
        tenantId,
        portfolioId,
        productId,
        quantity,
        notionalValue,
        averageCost: acquisitionPrice,
        currentValue: acquisitionPrice * quantity,
        unrealizedPnl: 0,
        realizedPnl: 0,
        acquisitionDate: new Date(),
        acquisitionPrice,
        lastValuationDate: new Date(),
        lastValuationPrice: acquisitionPrice,
        pricingAlerts: [],
        barrierAlerts: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store position
      await this.storePosition(position);

      // Trigger initial valuation
      await this.updatePositionValuation(position);

      // Set up monitoring
      if (product.hasBarrier) {
        await this.setupPositionBarrierMonitoring(position, product);
      }

      // Publish position creation event
      await this.publishPositionEvent('CREATED', position);

      logger.info('Structured product position created', { positionId });
      return position;

    } catch (error) {
      logger.error('Error creating structured product position:', error);
      throw error;
    }
  }

  // Get positions for portfolio
  async getPortfolioPositions(
    portfolioId: string,
    tenantId: string
  ): Promise<StructuredProductPosition[]> {
    try {
      // In a real implementation, this would query the database
      return await this.loadPortfolioPositions(portfolioId, tenantId);
    } catch (error) {
      logger.error('Error retrieving portfolio positions:', error);
      return [];
    }
  }

  // Update position valuation
  async updatePositionValuation(
    position: StructuredProductPosition
  ): Promise<StructuredProductPosition> {
    try {
      // Get current product valuation
      const valuation = await this.valuationService.valuateProduct({
        productId: position.productId,
        valuationDate: new Date(),
        includeGreeks: true
      });

      // Update position values
      const currentPrice = valuation.theoreticalValue / position.notionalValue * position.quantity;
      const currentValue = currentPrice * position.quantity;
      const unrealizedPnl = currentValue - (position.averageCost * position.quantity);

      const updatedPosition: StructuredProductPosition = {
        ...position,
        currentValue,
        unrealizedPnl,
        lastValuationDate: new Date(),
        lastValuationPrice: currentPrice,
        updatedAt: new Date()
      };

      // Update Greeks if available
      if (valuation.marketData.delta) {
        updatedPosition.portfolioDelta = valuation.marketData.delta * position.quantity;
      }
      if (valuation.marketData.gamma) {
        updatedPosition.portfolioGamma = valuation.marketData.gamma * position.quantity;
      }
      if (valuation.marketData.theta) {
        updatedPosition.portfolioTheta = valuation.marketData.theta * position.quantity;
      }
      if (valuation.marketData.vega) {
        updatedPosition.portfolioVega = valuation.marketData.vega * position.quantity;
      }

      // Store updated position
      await this.storePosition(updatedPosition);

      // Check for pricing alerts
      await this.checkPricingAlerts(updatedPosition);

      return updatedPosition;

    } catch (error) {
      logger.error('Error updating position valuation:', error);
      throw error;
    }
  }

  // Get issuer credit risk
  async getIssuerCreditRisk(
    issuerId: string,
    tenantId: string
  ): Promise<IssuerCreditRisk | null> {
    try {
      // In a real implementation, this would query credit risk data
      return await this.loadIssuerCreditRisk(issuerId, tenantId);
    } catch (error) {
      logger.error('Error retrieving issuer credit risk:', error);
      return null;
    }
  }

  // Portfolio-level analytics
  async getPortfolioAnalytics(
    portfolioId: string,
    tenantId: string
  ): Promise<{
    totalValue: number;
    totalNotional: number;
    unrealizedPnl: number;
    productTypeBreakdown: Record<StructuredProductType, number>;
    issuerExposure: Record<string, number>;
    averageMaturity: number;
    barrierRisk: {
      productsWithBarriers: number;
      approachingBarriers: number;
      hitBarriers: number;
    };
    greeksPortfolio: {
      totalDelta: number;
      totalGamma: number;
      totalTheta: number;
      totalVega: number;
    };
  }> {
    try {
      logger.info('Calculating portfolio analytics', { portfolioId, tenantId });

      const positions = await this.getPortfolioPositions(portfolioId, tenantId);
      
      if (positions.length === 0) {
        return this.getEmptyAnalytics();
      }

      // Load products for additional data
      const productIds = positions.map(p => p.productId);
      const products = await this.loadMultipleProducts(productIds, tenantId);
      const productMap = new Map(products.map(p => [p.id, p]));

      // Calculate totals
      const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
      const totalNotional = positions.reduce((sum, p) => sum + p.notionalValue, 0);
      const unrealizedPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);

      // Product type breakdown
      const productTypeBreakdown: Record<StructuredProductType, number> = {} as any;
      for (const position of positions) {
        const product = productMap.get(position.productId);
        if (product) {
          productTypeBreakdown[product.productType] = 
            (productTypeBreakdown[product.productType] || 0) + position.currentValue;
        }
      }

      // Issuer exposure
      const issuerExposure: Record<string, number> = {};
      for (const position of positions) {
        const product = productMap.get(position.productId);
        if (product) {
          issuerExposure[product.issuer] = 
            (issuerExposure[product.issuer] || 0) + position.currentValue;
        }
      }

      // Average maturity
      const totalWeightedMaturity = positions.reduce((sum, position) => {
        const product = productMap.get(position.productId);
        if (product) {
          const maturityYears = (product.maturityDate.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
          return sum + (maturityYears * position.currentValue);
        }
        return sum;
      }, 0);
      const averageMaturity = totalValue > 0 ? totalWeightedMaturity / totalValue : 0;

      // Barrier risk
      let productsWithBarriers = 0;
      let approachingBarriers = 0;
      let hitBarriers = 0;

      for (const position of positions) {
        const product = productMap.get(position.productId);
        if (product && product.hasBarrier) {
          productsWithBarriers++;
          
          // Check barrier alerts
          const approachingAlerts = position.barrierAlerts.filter(a => 
            a.alertType === 'BARRIER_APPROACH' && a.isActive
          );
          const hitAlerts = position.barrierAlerts.filter(a => 
            a.alertType === 'BARRIER_HIT'
          );
          
          if (approachingAlerts.length > 0) approachingBarriers++;
          if (hitAlerts.length > 0) hitBarriers++;
        }
      }

      // Portfolio Greeks
      const greeksPortfolio = {
        totalDelta: positions.reduce((sum, p) => sum + (p.portfolioDelta || 0), 0),
        totalGamma: positions.reduce((sum, p) => sum + (p.portfolioGamma || 0), 0),
        totalTheta: positions.reduce((sum, p) => sum + (p.portfolioTheta || 0), 0),
        totalVega: positions.reduce((sum, p) => sum + (p.portfolioVega || 0), 0)
      };

      const analytics = {
        totalValue,
        totalNotional,
        unrealizedPnl,
        productTypeBreakdown,
        issuerExposure,
        averageMaturity,
        barrierRisk: {
          productsWithBarriers,
          approachingBarriers,
          hitBarriers
        },
        greeksPortfolio
      };

      logger.info('Portfolio analytics calculated', {
        portfolioId,
        totalValue,
        positionCount: positions.length
      });

      return analytics;

    } catch (error) {
      logger.error('Error calculating portfolio analytics:', error);
      throw error;
    }
  }

  // Private helper methods

  private async validateProductData(request: CreateStructuredProductRequest): Promise<void> {
    // Validate required fields
    if (!request.productData.productName) {
      throw new Error('Product name is required');
    }
    if (!request.productData.issuer) {
      throw new Error('Issuer is required');
    }
    if (request.productData.notionalAmount <= 0) {
      throw new Error('Notional amount must be positive');
    }
    if (request.productData.maturityDate <= request.productData.issueDate) {
      throw new Error('Maturity date must be after issue date');
    }

    // Validate underlying assets
    if (!request.underlyingAssets || request.underlyingAssets.length === 0) {
      throw new Error('At least one underlying asset is required');
    }

    // Validate weights sum to 100% for basket products
    if (request.underlyingAssets.length > 1) {
      const totalWeight = request.underlyingAssets.reduce((sum, asset) => sum + asset.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        throw new Error('Underlying asset weights must sum to 100%');
      }
    }
  }

  private async storeProduct(product: StructuredProduct): Promise<void> {
    // In a real implementation, this would store in database
    logger.debug('Storing structured product', { productId: product.id });
  }

  private async loadProduct(productId: string, tenantId: string): Promise<StructuredProduct | null> {
    // In a real implementation, this would load from database
    return null;
  }

  private async loadMultipleProducts(productIds: string[], tenantId: string): Promise<StructuredProduct[]> {
    // In a real implementation, this would load from database
    return [];
  }

  private async storePosition(position: StructuredProductPosition): Promise<void> {
    // In a real implementation, this would store in database
    logger.debug('Storing structured product position', { positionId: position.id });
  }

  private async loadPortfolioPositions(portfolioId: string, tenantId: string): Promise<StructuredProductPosition[]> {
    // In a real implementation, this would load from database
    return [];
  }

  private async getMockProducts(tenantId: string): Promise<StructuredProduct[]> {
    // Mock data for demonstration
    return [];
  }

  private aggregateByField(products: StructuredProduct[], field: keyof StructuredProduct): Record<string, number> {
    return products.reduce((acc, product) => {
      const value = String(product[field]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAverageMaturity(products: StructuredProduct[]): number {
    if (products.length === 0) return 0;
    
    const totalMaturity = products.reduce((sum, product) => {
      const maturityYears = (product.maturityDate.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
      return sum + maturityYears;
    }, 0);
    
    return totalMaturity / products.length;
  }

  private async setupBarrierMonitoring(product: StructuredProduct): Promise<void> {
    logger.info('Setting up barrier monitoring', { productId: product.id });
    // Implementation would set up real-time monitoring
  }

  private async updateBarrierMonitoring(product: StructuredProduct): Promise<void> {
    logger.info('Updating barrier monitoring', { productId: product.id });
    // Implementation would update monitoring configuration
  }

  private async setupPositionBarrierMonitoring(
    position: StructuredProductPosition,
    product: StructuredProduct
  ): Promise<void> {
    logger.info('Setting up position barrier monitoring', { 
      positionId: position.id,
      productId: product.id 
    });
    // Implementation would set up position-specific monitoring
  }

  private async checkPricingAlerts(position: StructuredProductPosition): Promise<void> {
    // Implementation would check for pricing alert conditions
  }

  private async assessIssuerCreditRisk(issuerId: string, tenantId: string): Promise<void> {
    logger.info('Assessing issuer credit risk', { issuerId, tenantId });
    // Implementation would assess and store credit risk data
  }

  private async loadIssuerCreditRisk(issuerId: string, tenantId: string): Promise<IssuerCreditRisk | null> {
    // Implementation would load credit risk data
    return null;
  }

  private async validateUpdatePermissions(
    product: StructuredProduct,
    updates: Partial<StructuredProduct>,
    userId: string
  ): Promise<void> {
    // Validate user has permission to update this product
    // Check if certain fields are restricted based on product status
    if (product.status === 'ACTIVE' && updates.notionalAmount) {
      throw new Error('Cannot modify notional amount of active product');
    }
  }

  private requiresRevaluation(updates: Partial<StructuredProduct>): boolean {
    const significantFields = [
      'payoffParameters',
      'barriers',
      'underlyingAssets',
      'maturityDate'
    ];
    
    return significantFields.some(field => field in updates);
  }

  private async triggerRevaluation(product: StructuredProduct): Promise<void> {
    try {
      await this.valuationService.valuateProduct({
        productId: product.id,
        valuationDate: new Date(),
        includeGreeks: true
      });
    } catch (error) {
      logger.warn('Revaluation failed', { productId: product.id, error });
    }
  }

  private async publishProductEvent(eventType: string, product: StructuredProduct): Promise<void> {
    await this.kafkaService.publishEvent(`structured-products.product.${eventType.toLowerCase()}`, {
      productId: product.id,
      productName: product.productName,
      productType: product.productType,
      issuer: product.issuer,
      notionalAmount: product.notionalAmount,
      eventType,
      timestamp: new Date().toISOString()
    });
  }

  private async publishPositionEvent(eventType: string, position: StructuredProductPosition): Promise<void> {
    await this.kafkaService.publishEvent(`structured-products.position.${eventType.toLowerCase()}`, {
      positionId: position.id,
      productId: position.productId,
      portfolioId: position.portfolioId,
      quantity: position.quantity,
      currentValue: position.currentValue,
      eventType,
      timestamp: new Date().toISOString()
    });
  }

  private getEmptyAnalytics() {
    return {
      totalValue: 0,
      totalNotional: 0,
      unrealizedPnl: 0,
      productTypeBreakdown: {} as Record<StructuredProductType, number>,
      issuerExposure: {},
      averageMaturity: 0,
      barrierRisk: {
        productsWithBarriers: 0,
        approachingBarriers: 0,
        hitBarriers: 0
      },
      greeksPortfolio: {
        totalDelta: 0,
        totalGamma: 0,
        totalTheta: 0,
        totalVega: 0
      }
    };
  }

  // Batch operations
  async batchValuateProducts(
    productIds: string[],
    valuationDate: Date,
    tenantId: string
  ): Promise<StructuredProductValuationResponse[]> {
    try {
      logger.info('Starting batch product valuation', {
        productCount: productIds.length,
        tenantId
      });

      return await this.valuationService.valuatePortfolio(productIds, valuationDate, {
        includeGreeks: true,
        scenarioAnalysis: false
      });

    } catch (error) {
      logger.error('Error in batch product valuation:', error);
      throw error;
    }
  }

  // Real-time monitoring setup
  async startRealTimeMonitoring(tenantId: string): Promise<void> {
    try {
      logger.info('Starting real-time monitoring for structured products', { tenantId });
      
      // Start barrier monitoring
      await this.barrierMonitoringService.performRealTimeMonitoring(5); // 5-minute intervals
      
      logger.info('Real-time monitoring started', { tenantId });
      
    } catch (error) {
      logger.error('Error starting real-time monitoring:', error);
      throw error;
    }
  }
}
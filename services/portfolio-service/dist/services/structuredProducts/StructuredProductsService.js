"use strict";
// Structured Products Service
// Phase 4.1 - Main orchestration service for structured products functionality
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredProductsService = void 0;
const logger_1 = require("../../utils/logger");
const StructuredProductsValuationService_1 = require("./StructuredProductsValuationService");
const BarrierMonitoringService_1 = require("./BarrierMonitoringService");
const DocumentParsingService_1 = require("./DocumentParsingService");
class StructuredProductsService {
    prisma;
    kafkaService;
    valuationService;
    barrierMonitoringService;
    documentParsingService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
        this.valuationService = new StructuredProductsValuationService_1.StructuredProductsValuationService(prisma, kafkaService);
        this.barrierMonitoringService = new BarrierMonitoringService_1.BarrierMonitoringService(prisma, kafkaService);
        this.documentParsingService = new DocumentParsingService_1.DocumentParsingService(prisma, kafkaService);
    }
    // Create a new structured product
    async createProduct(request, tenantId, userId) {
        try {
            logger_1.logger.info('Creating structured product', {
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
            const product = {
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
            }
            catch (valuationError) {
                logger_1.logger.warn('Initial valuation failed', { productId, error: valuationError });
            }
            // Set up barrier monitoring if applicable
            if (product.hasBarrier) {
                await this.setupBarrierMonitoring(product);
            }
            // Assess issuer credit risk
            await this.assessIssuerCreditRisk(product.issuerId, tenantId);
            // Publish product creation event
            await this.publishProductEvent('CREATED', product);
            logger_1.logger.info('Structured product created successfully', {
                productId: product.id,
                productName: product.productName,
                notionalAmount: product.notionalAmount
            });
            return product;
        }
        catch (error) {
            logger_1.logger.error('Error creating structured product:', error);
            throw error;
        }
    }
    // Get structured product by ID
    async getProduct(productId, tenantId) {
        try {
            // In a real implementation, this would query the database
            return await this.loadProduct(productId, tenantId);
        }
        catch (error) {
            logger_1.logger.error('Error retrieving structured product:', error);
            return null;
        }
    }
    // Update structured product
    async updateProduct(productId, updates, tenantId, userId) {
        try {
            logger_1.logger.info('Updating structured product', { productId, tenantId, userId });
            // Load existing product
            const existingProduct = await this.loadProduct(productId, tenantId);
            if (!existingProduct) {
                throw new Error(`Product not found: ${productId}`);
            }
            // Validate update permissions
            await this.validateUpdatePermissions(existingProduct, updates, userId);
            // Apply updates
            const updatedProduct = {
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
            logger_1.logger.info('Structured product updated successfully', { productId });
            return updatedProduct;
        }
        catch (error) {
            logger_1.logger.error('Error updating structured product:', error);
            throw error;
        }
    }
    // Search structured products
    async searchProducts(request) {
        try {
            logger_1.logger.info('Searching structured products', {
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
                filteredProducts = filteredProducts.filter(p => request.productTypes.includes(p.productType));
            }
            if (request.issuers && request.issuers.length > 0) {
                filteredProducts = filteredProducts.filter(p => request.issuers.includes(p.issuer));
            }
            if (request.hasBarrier !== undefined) {
                filteredProducts = filteredProducts.filter(p => p.hasBarrier === request.hasBarrier);
            }
            if (request.riskLevels && request.riskLevels.length > 0) {
                filteredProducts = filteredProducts.filter(p => request.riskLevels.includes(p.riskLevel));
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
            const response = {
                products: paginatedProducts,
                total,
                aggregations,
                pagination: {
                    limit,
                    offset,
                    hasMore: offset + limit < total
                }
            };
            logger_1.logger.info('Product search completed', {
                totalResults: total,
                returnedResults: paginatedProducts.length
            });
            return response;
        }
        catch (error) {
            logger_1.logger.error('Error searching structured products:', error);
            throw error;
        }
    }
    // Valuate structured product
    async valuateProduct(request) {
        try {
            return await this.valuationService.valuateProduct(request);
        }
        catch (error) {
            logger_1.logger.error('Error in product valuation:', error);
            throw error;
        }
    }
    // Monitor barriers
    async monitorBarriers(request) {
        try {
            return await this.barrierMonitoringService.monitorBarriers(request);
        }
        catch (error) {
            logger_1.logger.error('Error in barrier monitoring:', error);
            throw error;
        }
    }
    // Parse document
    async parseDocument(documentId, documentPath, documentType, tenantId) {
        try {
            return await this.documentParsingService.parseDocument(documentId, documentPath, documentType, tenantId);
        }
        catch (error) {
            logger_1.logger.error('Error parsing document:', error);
            throw error;
        }
    }
    // Create product position
    async createPosition(productId, portfolioId, quantity, acquisitionPrice, tenantId, userId) {
        try {
            logger_1.logger.info('Creating structured product position', {
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
            const position = {
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
            logger_1.logger.info('Structured product position created', { positionId });
            return position;
        }
        catch (error) {
            logger_1.logger.error('Error creating structured product position:', error);
            throw error;
        }
    }
    // Get positions for portfolio
    async getPortfolioPositions(portfolioId, tenantId) {
        try {
            // In a real implementation, this would query the database
            return await this.loadPortfolioPositions(portfolioId, tenantId);
        }
        catch (error) {
            logger_1.logger.error('Error retrieving portfolio positions:', error);
            return [];
        }
    }
    // Update position valuation
    async updatePositionValuation(position) {
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
            const updatedPosition = {
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
        }
        catch (error) {
            logger_1.logger.error('Error updating position valuation:', error);
            throw error;
        }
    }
    // Get issuer credit risk
    async getIssuerCreditRisk(issuerId, tenantId) {
        try {
            // In a real implementation, this would query credit risk data
            return await this.loadIssuerCreditRisk(issuerId, tenantId);
        }
        catch (error) {
            logger_1.logger.error('Error retrieving issuer credit risk:', error);
            return null;
        }
    }
    // Portfolio-level analytics
    async getPortfolioAnalytics(portfolioId, tenantId) {
        try {
            logger_1.logger.info('Calculating portfolio analytics', { portfolioId, tenantId });
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
            const productTypeBreakdown = {};
            for (const position of positions) {
                const product = productMap.get(position.productId);
                if (product) {
                    productTypeBreakdown[product.productType] =
                        (productTypeBreakdown[product.productType] || 0) + position.currentValue;
                }
            }
            // Issuer exposure
            const issuerExposure = {};
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
                    const approachingAlerts = position.barrierAlerts.filter((a) => a.alertType === 'BARRIER_APPROACH' && a.isActive);
                    const hitAlerts = position.barrierAlerts.filter((a) => a.alertType === 'BARRIER_HIT');
                    if (approachingAlerts.length > 0)
                        approachingBarriers++;
                    if (hitAlerts.length > 0)
                        hitBarriers++;
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
            logger_1.logger.info('Portfolio analytics calculated', {
                portfolioId,
                totalValue,
                positionCount: positions.length
            });
            return analytics;
        }
        catch (error) {
            logger_1.logger.error('Error calculating portfolio analytics:', error);
            throw error;
        }
    }
    // Private helper methods
    async validateProductData(request) {
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
    async storeProduct(product) {
        // In a real implementation, this would store in database
        logger_1.logger.debug('Storing structured product', { productId: product.id });
    }
    async loadProduct(productId, tenantId) {
        // In a real implementation, this would load from database
        return null;
    }
    async loadMultipleProducts(productIds, tenantId) {
        // In a real implementation, this would load from database
        return [];
    }
    async storePosition(position) {
        // In a real implementation, this would store in database
        logger_1.logger.debug('Storing structured product position', { positionId: position.id });
    }
    async loadPortfolioPositions(portfolioId, tenantId) {
        // In a real implementation, this would load from database
        return [];
    }
    async getMockProducts(tenantId) {
        // Mock data for demonstration
        return [];
    }
    aggregateByField(products, field) {
        return products.reduce((acc, product) => {
            const value = String(product[field]);
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
    }
    calculateAverageMaturity(products) {
        if (products.length === 0)
            return 0;
        const totalMaturity = products.reduce((sum, product) => {
            const maturityYears = (product.maturityDate.getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000);
            return sum + maturityYears;
        }, 0);
        return totalMaturity / products.length;
    }
    async setupBarrierMonitoring(product) {
        logger_1.logger.info('Setting up barrier monitoring', { productId: product.id });
        // Implementation would set up real-time monitoring
    }
    async updateBarrierMonitoring(product) {
        logger_1.logger.info('Updating barrier monitoring', { productId: product.id });
        // Implementation would update monitoring configuration
    }
    async setupPositionBarrierMonitoring(position, product) {
        logger_1.logger.info('Setting up position barrier monitoring', {
            positionId: position.id,
            productId: product.id
        });
        // Implementation would set up position-specific monitoring
    }
    async checkPricingAlerts(position) {
        // Implementation would check for pricing alert conditions
    }
    async assessIssuerCreditRisk(issuerId, tenantId) {
        logger_1.logger.info('Assessing issuer credit risk', { issuerId, tenantId });
        // Implementation would assess and store credit risk data
    }
    async loadIssuerCreditRisk(issuerId, tenantId) {
        // Implementation would load credit risk data
        return null;
    }
    async validateUpdatePermissions(product, updates, userId) {
        // Validate user has permission to update this product
        // Check if certain fields are restricted based on product status
        if (product.status === 'ACTIVE' && updates.notionalAmount) {
            throw new Error('Cannot modify notional amount of active product');
        }
    }
    requiresRevaluation(updates) {
        const significantFields = [
            'payoffParameters',
            'barriers',
            'underlyingAssets',
            'maturityDate'
        ];
        return significantFields.some(field => field in updates);
    }
    async triggerRevaluation(product) {
        try {
            await this.valuationService.valuateProduct({
                productId: product.id,
                valuationDate: new Date(),
                includeGreeks: true
            });
        }
        catch (error) {
            logger_1.logger.warn('Revaluation failed', { productId: product.id, error });
        }
    }
    async publishProductEvent(eventType, product) {
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
    async publishPositionEvent(eventType, position) {
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
    getEmptyAnalytics() {
        return {
            totalValue: 0,
            totalNotional: 0,
            unrealizedPnl: 0,
            productTypeBreakdown: {},
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
    async batchValuateProducts(productIds, valuationDate, tenantId) {
        try {
            logger_1.logger.info('Starting batch product valuation', {
                productCount: productIds.length,
                tenantId
            });
            return await this.valuationService.valuatePortfolio(productIds, valuationDate, {
                includeGreeks: true,
                scenarioAnalysis: false
            });
        }
        catch (error) {
            logger_1.logger.error('Error in batch product valuation:', error);
            throw error;
        }
    }
    // Real-time monitoring setup
    async startRealTimeMonitoring(tenantId) {
        try {
            logger_1.logger.info('Starting real-time monitoring for structured products', { tenantId });
            // Start barrier monitoring
            await this.barrierMonitoringService.performRealTimeMonitoring(5); // 5-minute intervals
            logger_1.logger.info('Real-time monitoring started', { tenantId });
        }
        catch (error) {
            logger_1.logger.error('Error starting real-time monitoring:', error);
            throw error;
        }
    }
}
exports.StructuredProductsService = StructuredProductsService;

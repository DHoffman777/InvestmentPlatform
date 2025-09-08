export const __esModule: boolean;
export class StructuredProductsService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    valuationService: StructuredProductsValuationService_1.StructuredProductsValuationService;
    barrierMonitoringService: BarrierMonitoringService_1.BarrierMonitoringService;
    documentParsingService: DocumentParsingService_1.DocumentParsingService;
    createProduct(request: any, tenantId: any, userId: any): Promise<any>;
    getProduct(productId: any, tenantId: any): Promise<any>;
    updateProduct(productId: any, updates: any, tenantId: any, userId: any): Promise<any>;
    searchProducts(request: any): Promise<{
        products: any[];
        total: number;
        aggregations: {
            byProductType: any;
            byIssuer: any;
            byRiskLevel: any;
            averageMaturity: number;
            totalNotional: any;
        };
        pagination: {
            limit: any;
            offset: any;
            hasMore: boolean;
        };
    }>;
    valuateProduct(request: any): Promise<import("../../models/structuredProducts/StructuredProducts").StructuredProductValuationResponse>;
    monitorBarriers(request: any): Promise<import("../../models/structuredProducts/StructuredProducts").BarrierMonitoringResponse>;
    parseDocument(documentId: any, documentPath: any, documentType: any, tenantId: any): Promise<import("../../models/structuredProducts/StructuredProducts").DocumentParsingResult>;
    createPosition(productId: any, portfolioId: any, quantity: any, acquisitionPrice: any, tenantId: any, userId: any): Promise<{
        id: string;
        tenantId: any;
        portfolioId: any;
        productId: any;
        quantity: any;
        notionalValue: number;
        averageCost: any;
        currentValue: number;
        unrealizedPnl: number;
        realizedPnl: number;
        acquisitionDate: Date;
        acquisitionPrice: any;
        lastValuationDate: Date;
        lastValuationPrice: any;
        pricingAlerts: any[];
        barrierAlerts: any[];
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPortfolioPositions(portfolioId: any, tenantId: any): Promise<any[]>;
    updatePositionValuation(position: any): Promise<any>;
    getIssuerCreditRisk(issuerId: any, tenantId: any): Promise<any>;
    getPortfolioAnalytics(portfolioId: any, tenantId: any): Promise<{
        totalValue: any;
        totalNotional: any;
        unrealizedPnl: any;
        productTypeBreakdown: {};
        issuerExposure: {};
        averageMaturity: number;
        barrierRisk: {
            productsWithBarriers: number;
            approachingBarriers: number;
            hitBarriers: number;
        };
        greeksPortfolio: {
            totalDelta: any;
            totalGamma: any;
            totalTheta: any;
            totalVega: any;
        };
    }>;
    validateProductData(request: any): Promise<void>;
    storeProduct(product: any): Promise<void>;
    loadProduct(productId: any, tenantId: any): Promise<any>;
    loadMultipleProducts(productIds: any, tenantId: any): Promise<any[]>;
    storePosition(position: any): Promise<void>;
    loadPortfolioPositions(portfolioId: any, tenantId: any): Promise<any[]>;
    getMockProducts(tenantId: any): Promise<any[]>;
    aggregateByField(products: any, field: any): any;
    calculateAverageMaturity(products: any): number;
    setupBarrierMonitoring(product: any): Promise<void>;
    updateBarrierMonitoring(product: any): Promise<void>;
    setupPositionBarrierMonitoring(position: any, product: any): Promise<void>;
    checkPricingAlerts(position: any): Promise<void>;
    assessIssuerCreditRisk(issuerId: any, tenantId: any): Promise<void>;
    loadIssuerCreditRisk(issuerId: any, tenantId: any): Promise<any>;
    validateUpdatePermissions(product: any, updates: any, userId: any): Promise<void>;
    requiresRevaluation(updates: any): boolean;
    triggerRevaluation(product: any): Promise<void>;
    publishProductEvent(eventType: any, product: any): Promise<void>;
    publishPositionEvent(eventType: any, position: any): Promise<void>;
    getEmptyAnalytics(): {
        totalValue: number;
        totalNotional: number;
        unrealizedPnl: number;
        productTypeBreakdown: {};
        issuerExposure: {};
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
    };
    batchValuateProducts(productIds: any, valuationDate: any, tenantId: any): Promise<import("../../models/structuredProducts/StructuredProducts").StructuredProductValuationResponse[]>;
    startRealTimeMonitoring(tenantId: any): Promise<void>;
}
import StructuredProductsValuationService_1 = require("./StructuredProductsValuationService");
import BarrierMonitoringService_1 = require("./BarrierMonitoringService");
import DocumentParsingService_1 = require("./DocumentParsingService");

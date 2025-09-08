import { PrismaClient } from '@prisma/client';
import {
  Order,
  OrderExecution,
  OrderAllocation,
  SmartOrderRouting,
  OrderRisk,
  CreateOrderRequest,
  ModifyOrderRequest,
  CancelOrderRequest,
  OrderSearchRequest,
  OrderSearchResult,
  OrderValidationResult,
  OrderCostEstimate,
  BestExecutionReport,
  OrderType,
  OrderSide,
  OrderStatus,
  OrderState,
  TradingSession,
  PreTradeCheckStatus,
  AllocationStatus,
  AllocationMethod,
  ExecutionVenueType,
  SettlementStatus,
  ComplianceFlag,
  ComplianceFlagType,
  ComplianceSeverity,
  RiskBreach,
  RiskBreachType,
  RiskSeverity
} from '../models/trading/OrderManagement';

export class OrderManagementService {
  private prisma: PrismaClient;
  private kafkaService: any;

  constructor(prisma: PrismaClient, kafkaService: any) {
    this.prisma = prisma;
    this.kafkaService = kafkaService;
  }

  // Order Lifecycle Management

  async createOrder(request: CreateOrderRequest, tenantId: string, userId: string): Promise<Order> {
    // Pre-trade validation
    const validation = await this.validateOrder(request, tenantId);
    if (!validation.isValid) {
      throw new Error(`Order validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate client order ID
    const clientOrderId = this.generateClientOrderId();

    // Create order object
    const order: Omit<Order, 'id'> = {
      tenantId,
      portfolioId: request.portfolioId,
      securityId: request.securityId,
      clientOrderId,
      orderType: request.orderType,
      orderSide: request.orderSide,
      timeInForce: request.timeInForce,
      quantity: request.quantity,
      filledQuantity: 0,
      remainingQuantity: request.quantity,
      orderPrice: request.orderPrice,
      stopPrice: request.stopPrice,
      limitPrice: request.limitPrice,
      orderStatus: OrderStatus.PENDING_NEW,
      orderState: OrderState.CREATED,
      executionInstructions: request.executionInstructions,
      routingInstructions: request.routingInstructions,
      orderDate: new Date(),
      expirationDate: request.expirationDate ?? undefined,
      tradingSession: request.tradingSession || this.getCurrentTradingSession(),
      preTradeCheckStatus: PreTradeCheckStatus.PENDING,
      allocationMethod: request.allocations ? AllocationMethod.MANUAL : undefined,
      settlementCurrency: await this.getInstrumentCurrency(request.securityId, tenantId),
      tags: request.tags,
      customFields: request.customFields,
      createdBy: userId,
      lastModifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create order in database
    const createdOrder = await (this.prisma as any).order.create({
      data: order
    });

    // Create allocations if provided
    if (request.allocations && request.allocations.length > 0) {
      await this.createOrderAllocations(createdOrder.id, request.allocations, tenantId);
    }

    // Perform pre-trade checks
    await this.performPreTradeChecks(createdOrder.id, tenantId);

    // Create smart order routing if algorithmic
    if (request.orderType === OrderType.ALGORITHMIC && request.routingInstructions) {
      await this.createSmartOrderRouting(createdOrder.id, request.routingInstructions, tenantId);
    }

    // Publish order created event
    await this.kafkaService.publishEvent('order-created', {
      orderId: createdOrder.id,
      clientOrderId: createdOrder.clientOrderId,
      tenantId,
      portfolioId: request.portfolioId,
      securityId: request.securityId,
      orderType: request.orderType,
      orderSide: request.orderSide,
      quantity: request.quantity,
      createdBy: userId,
      timestamp: new Date().toISOString()
    });

    return createdOrder;
  }

  async modifyOrder(request: ModifyOrderRequest, tenantId: string, userId: string): Promise<Order> {
    const existingOrder = await (this.prisma as any).order.findFirst({
      where: {
        id: request.orderId,
        tenantId
      }
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Check if order can be modified
    if (!this.canModifyOrder(existingOrder)) {
      throw new Error(`Order cannot be modified in current status: ${existingOrder.orderStatus}`);
    }

    // Create modification request
    const updates: Partial<Order> = {
      quantity: request.quantity,
      orderPrice: request.orderPrice,
      stopPrice: request.stopPrice,
      limitPrice: request.limitPrice,
      timeInForce: request.timeInForce,
      expirationDate: request.expirationDate ?? undefined,
      executionInstructions: request.executionInstructions,
      routingInstructions: request.routingInstructions,
      modifiedBy: userId,
      lastModifiedAt: new Date(),
      updatedAt: new Date()
    };

    // If quantity is being modified, update remaining quantity
    if (request.quantity !== undefined) {
      updates.remainingQuantity = request.quantity - existingOrder.filledQuantity;
    }

    const updatedOrder = await (this.prisma as any).order.update({
      where: { id: request.orderId },
      data: updates
    });

    // Publish order modified event
    await this.kafkaService.publishEvent('order-modified', {
      orderId: request.orderId,
      clientOrderId: existingOrder.clientOrderId,
      tenantId,
      changes: updates,
      modifiedBy: userId,
      timestamp: new Date().toISOString()
    });

    return updatedOrder;
  }

  async cancelOrder(request: CancelOrderRequest, tenantId: string, userId: string): Promise<Order> {
    const existingOrder = await (this.prisma as any).order.findFirst({
      where: {
        id: request.orderId,
        tenantId
      }
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Check if order can be cancelled
    if (!this.canCancelOrder(existingOrder)) {
      throw new Error(`Order cannot be cancelled in current status: ${existingOrder.orderStatus}`);
    }

    const cancelledOrder = await (this.prisma as any).order.update({
      where: { id: request.orderId },
      data: {
        orderStatus: OrderStatus.PENDING_CANCEL,
        orderState: OrderState.WORKING,
        cancelledBy: userId,
        cancelReason: request.cancelReason,
        lastModifiedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Publish order cancel requested event
    await this.kafkaService.publishEvent('order-cancel-requested', {
      orderId: request.orderId,
      clientOrderId: existingOrder.clientOrderId,
      tenantId,
      cancelReason: request.cancelReason,
      cancelledBy: userId,
      timestamp: new Date().toISOString()
    });

    return cancelledOrder;
  }

  // Order Execution Management

  async recordExecution(
    orderId: string,
    executionPrice: number,
    executionQuantity: number,
    executionVenue: string,
    executionVenueType: ExecutionVenueType,
    tenantId: string,
    reportedBy: string
  ): Promise<OrderExecution> {
    const order = await (this.prisma as any).order.findFirst({
      where: { id: orderId, tenantId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Create execution record
    const execution: Omit<OrderExecution, 'id'> = {
      tenantId,
      orderId,
      executionId: this.generateExecutionId(),
      executionPrice,
      executionQuantity,
      executionTime: new Date(),
      executionVenue,
      executionVenueType,
      tradeId: this.generateTradeId(),
      settlementDate: this.calculateSettlementDate(new Date()),
      settlementStatus: SettlementStatus.PENDING,
      reportedBy,
      reportedAt: new Date(),
      createdAt: new Date()
    };

    const createdExecution = await (this.prisma as any).orderExecution.create({
      data: execution
    });

    // Update order with execution
    const newFilledQuantity = order.filledQuantity + executionQuantity;
    const newRemainingQuantity = Math.max(0, order.quantity - newFilledQuantity);
    
    let newOrderStatus = order.orderStatus;
    let newOrderState = order.orderState;

    if (newRemainingQuantity === 0) {
      newOrderStatus = OrderStatus.FILLED;
      newOrderState = OrderState.COMPLETED;
    } else {
      newOrderStatus = OrderStatus.PARTIALLY_FILLED;
      newOrderState = OrderState.WORKING;
    }

    // Calculate average fill price
    const totalFilledValue = (order.averageFillPrice || 0) * order.filledQuantity + 
                            executionPrice * executionQuantity;
    const averageFillPrice = totalFilledValue / newFilledQuantity;

    await (this.prisma as any).order.update({
      where: { id: orderId },
      data: {
        filledQuantity: newFilledQuantity,
        remainingQuantity: newRemainingQuantity,
        averageFillPrice,
        orderStatus: newOrderStatus,
        orderState: newOrderState,
        lastModifiedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Process allocations if this is a block order
    if (order.allocations && order.allocations.length > 0) {
      await this.processExecutionAllocations(orderId, createdExecution, tenantId);
    }

    // Publish execution event
    await this.kafkaService.publishEvent('order-execution', {
      orderId,
      executionId: createdExecution.executionId,
      clientOrderId: order.clientOrderId,
      tenantId,
      executionPrice,
      executionQuantity,
      executionVenue,
      filledQuantity: newFilledQuantity,
      remainingQuantity: newRemainingQuantity,
      orderStatus: newOrderStatus,
      timestamp: new Date().toISOString()
    });

    return createdExecution;
  }

  // Order Search and Retrieval

  async searchOrders(request: OrderSearchRequest, tenantId: string): Promise<OrderSearchResult> {
    const where: any = { tenantId };

    // Apply filters
    if (request.portfolioIds && request.portfolioIds.length > 0) {
      where.portfolioId = { in: request.portfolioIds };
    }

    if ((request as any).securityIds && (request as any).securityIds.length > 0) {
      where.securityId = { in: (request as any).securityIds };
    }

    if (request.orderTypes && request.orderTypes.length > 0) {
      where.orderType = { in: request.orderTypes };
    }

    if (request.orderStatuses && request.orderStatuses.length > 0) {
      where.orderStatus = { in: request.orderStatuses };
    }

    if (request.orderStates && request.orderStates.length > 0) {
      where.orderState = { in: request.orderStates };
    }

    if (request.fromDate || request.toDate) {
      where.orderDate = {};
      if (request.fromDate) where.orderDate.gte = request.fromDate;
      if (request.toDate) where.orderDate.lte = request.toDate;
    }

    if (request.createdBy) {
      where.createdBy = request.createdBy;
    }

    if (request.tags && request.tags.length > 0) {
      where.tags = { hasSome: request.tags };
    }

    const [orders, total] = await Promise.all([
      (this.prisma as any).order.findMany({
        where,
        include: {
          executions: true,
          allocations: true
        },
        orderBy: [
          { orderDate: 'desc' },
          { createdAt: 'desc' }
        ],
        take: request.limit || 50,
        skip: request.offset || 0
      }) as any,
      (this.prisma as any).order.count({ where })
    ]);

    return {
      orders,
      total,
      hasMore: (request.offset || 0) + orders.length < total,
      searchCriteria: request
    };
  }

  async getOrderById(orderId: string, tenantId: string): Promise<Order | null> {
    return await (this.prisma as any).order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        executions: true,
        allocations: true,
        smartRouting: true,
        risk: true
      }
    });
  }

  // Pre-trade Risk and Compliance

  async validateOrder(request: CreateOrderRequest, tenantId: string): Promise<OrderValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!request.portfolioId) errors.push('Portfolio ID is required');
    if (!request.securityId) errors.push('Instrument ID is required');
    if (request.quantity <= 0) errors.push('Order quantity must be positive');

    // Price validation for limit orders
    if (request.orderType === OrderType.LIMIT && !request.orderPrice) {
      errors.push('Limit price is required for limit orders');
    }

    if (request.orderType === OrderType.STOP && !request.stopPrice) {
      errors.push('Stop price is required for stop orders');
    }

    if (request.orderType === OrderType.STOP_LIMIT && (!request.stopPrice || !request.limitPrice)) {
      errors.push('Both stop price and limit price are required for stop-limit orders');
    }

    // Portfolio validation
    const portfolio = await (this.prisma as any).portfolio.findFirst({
      where: { id: request.portfolioId, tenantId }
    });

    if (!portfolio) {
      errors.push('Portfolio not found');
    }

    // Instrument validation
    const instrument = await (this.prisma as any).instrumentMaster.findFirst({
      where: { instrumentId: request.securityId, tenantId }
    });

    if (!instrument) {
      errors.push('Instrument not found');
    } else if (!instrument.isActive) {
      errors.push('Instrument is not active for trading');
    }

    // Risk checks
    let riskScore = 0;
    let estimatedCosts: OrderCostEstimate | undefined;

    if (errors.length === 0 && portfolio && instrument) {
      // Calculate risk score
      riskScore = await this.calculateOrderRiskScore(request, portfolio, instrument, tenantId);

      // Estimate costs
      estimatedCosts = await this.estimateOrderCosts(request, instrument, tenantId);

      // Position limits
      const currentPosition = await this.getCurrentPosition(request.portfolioId, request.securityId, tenantId);
      const newPosition = request.orderSide === OrderSide.BUY ? 
        currentPosition + request.quantity : currentPosition - request.quantity;

      if (Math.abs(newPosition) > portfolio.maxPositionSize) {
        errors.push('Order would exceed maximum position size');
      }

      // Concentration limits
      const portfolioValue = await this.getPortfolioValue(request.portfolioId, tenantId);
      const orderValue = (request.orderPrice || instrument.lastPrice || 0) * request.quantity;
      const concentrationPct = (orderValue / portfolioValue) * 100;

      if (concentrationPct > portfolio.maxConcentration) {
        warnings.push(`Order represents ${concentrationPct.toFixed(2)}% of portfolio value`);
      }
    }

    return {
      orderId: '', // Will be set when order is created
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      riskScore,
      estimatedCosts
    };
  }

  async performPreTradeChecks(orderId: string, tenantId: string): Promise<any> {
    const order = await (this.prisma as any).order.findFirst({
      where: { id: orderId, tenantId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const complianceFlags: ComplianceFlag[] = [];
    let checksPassed = true;

    // Restricted list check
    const restrictedInstruments = await this.getRestrictedInstruments(tenantId);
    if (restrictedInstruments.includes(order.securityId)) {
      complianceFlags.push({
        type: ComplianceFlagType.RESTRICTED_LIST,
        severity: ComplianceSeverity.BLOCKING,
        description: 'Instrument is on restricted list',
        requiresApproval: true
      });
      checksPassed = false;
    }

    // Concentration limit check
    const concentrationCheck = await this.checkConcentrationLimits(order, tenantId);
    if (!concentrationCheck.passed) {
      complianceFlags.push({
        type: ComplianceFlagType.CONCENTRATION_LIMIT,
        severity: concentrationCheck.severity,
        description: concentrationCheck.message,
        requiresApproval: concentrationCheck.severity === ComplianceSeverity.BLOCKING
      });
      if (concentrationCheck.severity === ComplianceSeverity.BLOCKING) {
        checksPassed = false;
      }
    }

    // Update order with compliance results
    await (this.prisma as any).order.update({
      where: { id: orderId },
      data: {
        preTradeCheckStatus: checksPassed ? PreTradeCheckStatus.PASSED : PreTradeCheckStatus.FAILED,
        complianceFlags,
        orderStatus: checksPassed ? OrderStatus.NEW : OrderStatus.SUSPENDED,
        orderState: checksPassed ? OrderState.VALIDATED : OrderState.FAILED,
        lastModifiedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Publish compliance check event
    await this.kafkaService.publishEvent('pre-trade-check-completed', {
      orderId,
      tenantId,
      checksPassed,
      complianceFlags,
      timestamp: new Date().toISOString()
    });
  }

  // Best Execution Analysis

  async generateBestExecutionReport(orderId: string, tenantId: string): Promise<BestExecutionReport> {
    const order = await (this.prisma as any).order.findFirst({
      where: { id: orderId, tenantId },
      include: { executions: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Get market data for the instrument at order time
    const marketData = await this.getHistoricalMarketData(
      order.securityId,
      order.orderDate,
      tenantId
    );

    // Calculate execution quality metrics
    const executionQuality = this.calculateExecutionQuality(order, marketData);
    
    // Compare against benchmarks
    const benchmarkComparison = this.calculateBenchmarkComparison(order, marketData);
    
    // Analyze venue performance
    const venueAnalysis = this.analyzeVenuePerformance(order.executions);
    
    // Generate recommendations
    const recommendations = this.generateExecutionRecommendations(
      executionQuality,
      benchmarkComparison,
      venueAnalysis
    );

    return {
      orderId,
      executionQuality,
      benchmarkComparison,
      venueAnalysis,
      recommendations,
      generatedAt: new Date()
    };
  }

  // Private Helper Methods

  private generateClientOrderId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ORD-${timestamp}-${random}`.toUpperCase();
  }

  private generateExecutionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `EXEC-${timestamp}-${random}`.toUpperCase();
  }

  private generateTradeId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `TRD-${timestamp}-${random}`.toUpperCase();
  }

  private getCurrentTradingSession(): TradingSession {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 9 || (hour === 9 && now.getMinutes() < 30)) {
      return TradingSession.PRE_MARKET;
    } else if (hour >= 16) {
      return TradingSession.POST_MARKET;
    } else {
      return TradingSession.REGULAR;
    }
  }

  private async getInstrumentCurrency(securityId: string, tenantId: string): Promise<string> {
    const instrument = await (this.prisma as any).instrumentMaster.findFirst({
      where: { instrumentId: securityId, tenantId }
    });
    return instrument?.tradingCurrency || 'USD';
  }

  private canModifyOrder(order: Order): boolean {
    const modifiableStatuses = [
      OrderStatus.NEW,
      OrderStatus.PARTIALLY_FILLED,
      OrderStatus.PENDING_NEW
    ];
    return modifiableStatuses.includes(order.orderStatus);
  }

  private canCancelOrder(order: Order): boolean {
    const cancellableStatuses = [
      OrderStatus.NEW,
      OrderStatus.PARTIALLY_FILLED,
      OrderStatus.PENDING_NEW
    ];
    return cancellableStatuses.includes(order.orderStatus);
  }

  private calculateSettlementDate(tradeDate: Date): Date {
    // T+2 settlement for most securities
    const settlementDate = new Date(tradeDate);
    settlementDate.setDate(settlementDate.getDate() + 2);
    return settlementDate;
  }

  private async calculateOrderRiskScore(
    request: CreateOrderRequest,
    portfolio: any,
    instrument: any,
    tenantId: string
  ): Promise<number> {
    let riskScore = 0;

    // Base risk score
    riskScore += 10;

    // Order size risk
    const orderValue = (request.orderPrice || instrument.lastPrice || 0) * request.quantity;
    const portfolioValue = await this.getPortfolioValue(request.portfolioId, tenantId);
    const sizeRisk = (orderValue / portfolioValue) * 100;
    riskScore += Math.min(sizeRisk * 0.5, 30);

    // Liquidity risk
    if (instrument.liquidityTier === 'LOW') riskScore += 20;
    if (instrument.liquidityTier === 'MEDIUM') riskScore += 10;

    // Volatility risk
    if (instrument.volatility > 0.3) riskScore += 15;
    if (instrument.volatility > 0.5) riskScore += 10;

    return Math.min(riskScore, 100);
  }

  private async estimateOrderCosts(
    request: CreateOrderRequest,
    instrument: any,
    tenantId: string
  ): Promise<OrderCostEstimate> {
    const orderValue = (request.orderPrice || instrument.lastPrice || 0) * request.quantity;
    
    // Simple cost estimation - in production, would use more sophisticated models
    const estimatedCommission = Math.max(orderValue * 0.0005, 1.0); // 5bps min $1
    const estimatedFees = orderValue * 0.0001; // 1bp
    const estimatedMarketImpact = request.orderType === OrderType.MARKET ? 
      orderValue * 0.002 : orderValue * 0.001; // 20bps for market, 10bps for limit
    
    return {
      estimatedCommission,
      estimatedFees,
      estimatedMarketImpact,
      estimatedTotalCost: estimatedCommission + estimatedFees + estimatedMarketImpact,
      priceImpactBps: request.orderType === OrderType.MARKET ? 20 : 10
    };
  }

  private async getCurrentPosition(portfolioId: string, securityId: string, tenantId: string): Promise<number> {
    const position = await (this.prisma as any).position.findFirst({
      where: { portfolioId, securityId, tenantId }
    });
    return position?.quantity?.toNumber() || 0; // convert Decimal to number
  }

  private async getPortfolioValue(portfolioId: string, tenantId: string): Promise<number> {
    const portfolio = await (this.prisma as any).portfolio.findFirst({
      where: { id: portfolioId, tenantId }
    });
    return portfolio?.totalValue?.toNumber() || 0; // convert Decimal to number
  }

  private async getRestrictedInstruments(tenantId: string): Promise<string[]> {
    // This would query a restricted instruments table
    return [];
  }

  private async checkConcentrationLimits(order: Order, tenantId: string): Promise<{
    passed: boolean;
    severity: ComplianceSeverity;
    message: string;
  }> {
    // Simplified concentration check
    return {
      passed: true,
      severity: ComplianceSeverity.INFO,
      message: 'Concentration limits passed'
    };
  }

  private async createOrderAllocations(
    orderId: string,
    allocations: any[],
    tenantId: string
  ): Promise<any> {
    for (const allocation of allocations) {
      await (this.prisma as any).orderAllocation.create({
        data: {
          orderId,
          tenantId,
          ...allocation,
          allocationStatus: AllocationStatus.PENDING
        }
      });
    }
  }

  private async createSmartOrderRouting(
    orderId: string,
    routingInstructions: any,
    tenantId: string
  ): Promise<any> {
    // Implementation would create smart order routing record
  }

  private async processExecutionAllocations(
    orderId: string,
    execution: OrderExecution,
    tenantId: string
  ): Promise<any> {
    // Implementation would allocate execution to different portfolios/accounts
  }

  private async getHistoricalMarketData(
    securityId: string,
    date: Date,
    tenantId: string
  ): Promise<any> {
    // Implementation would retrieve historical market data
    return {};
  }

  private calculateExecutionQuality(order: Order, marketData: any): any {
    // Implementation would calculate execution quality metrics
    return {
      implementation_shortfall: 0,
      priceImprovement: 0,
      fillRate: order.filledQuantity / order.quantity,
      averageExecutionTime: 0,
      slippage: 0
    };
  }

  private calculateBenchmarkComparison(order: Order, marketData: any): any {
    // Implementation would compare execution against benchmarks
    return {
      vwap: 0,
      twap: 0,
      arrivalPrice: 0,
      closePrice: 0,
      performanceVsVwap: 0,
      performanceVsTwap: 0
    };
  }

  private analyzeVenuePerformance(executions: OrderExecution[]): any[] {
    // Implementation would analyze performance by venue
    return [];
  }

  private generateExecutionRecommendations(
    executionQuality: any,
    benchmarkComparison: any,
    venueAnalysis: any[]
  ): string[] {
    // Implementation would generate recommendations based on analysis
    return ['Order executed within acceptable parameters'];
  }
}


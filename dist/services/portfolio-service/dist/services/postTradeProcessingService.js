"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostTradeProcessingService = void 0;
const PostTradeProcessing_1 = require("../models/trading/PostTradeProcessing");
class PostTradeProcessingService {
    prisma;
    kafkaService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    // Trade Confirmation Management
    async createTradeConfirmation(request, tenantId, userId) {
        // Get trade and execution details
        const trade = await this.prisma.trade.findFirst({
            where: { id: request.tradeId, tenantId }
        });
        if (!trade) {
            throw new Error('Trade not found');
        }
        const execution = await this.prisma.orderExecution.findFirst({
            where: { id: request.executionId, tenantId }
        });
        if (!execution) {
            throw new Error('Execution not found');
        }
        // Create confirmation record
        const confirmation = {
            tenantId,
            tradeId: request.tradeId,
            orderId: request.orderId,
            executionId: request.executionId,
            securityId: trade.securityId,
            quantity: execution.executionQuantity,
            price: execution.executionPrice,
            grossAmount: execution.executionPrice * execution.executionQuantity,
            netAmount: (execution.executionPrice * execution.executionQuantity) -
                (execution.commission + execution.regulatoryFees + execution.exchangeFees + execution.otherFees),
            tradeDate: trade.tradeDate,
            settlementDate: execution.settlementDate,
            counterpartyId: request.counterpartyId,
            counterpartyName: await this.getCounterpartyName(request.counterpartyId, tenantId),
            confirmationStatus: PostTradeProcessing_1.TradeConfirmationStatus.PENDING,
            confirmationMethod: request.confirmationMethod,
            commission: execution.commission || 0,
            exchangeFees: execution.exchangeFees || 0,
            regulatoryFees: execution.regulatoryFees || 0,
            otherFees: execution.otherFees || 0,
            confirmationReference: this.generateConfirmationReference(),
            externalTradeId: trade.externalTradeId,
            notes: request.notes,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId
        };
        const createdConfirmation = await this.prisma.tradeConfirmation.create({
            data: confirmation
        });
        // Send confirmation if electronic method
        if (request.confirmationMethod === 'ELECTRONIC') {
            await this.sendTradeConfirmation(createdConfirmation.id, tenantId);
        }
        // Publish event
        await this.kafkaService.publishEvent('trade-confirmation-created', {
            confirmationId: createdConfirmation.id,
            tradeId: request.tradeId,
            tenantId,
            counterpartyId: request.counterpartyId,
            timestamp: new Date().toISOString()
        });
        return createdConfirmation;
    }
    async updateTradeConfirmation(request, tenantId, userId) {
        const existing = await this.prisma.tradeConfirmation.findFirst({
            where: { id: request.confirmationId, tenantId }
        });
        if (!existing) {
            throw new Error('Trade confirmation not found');
        }
        const updates = {
            confirmationStatus: request.confirmationStatus,
            affirmedAt: request.affirmedAt,
            notes: request.notes,
            modifiedBy: userId,
            updatedAt: new Date()
        };
        // Set confirmation received time if being confirmed
        if (request.confirmationStatus === PostTradeProcessing_1.TradeConfirmationStatus.CONFIRMED && !existing.confirmationReceivedAt) {
            updates.confirmationReceivedAt = new Date();
        }
        const updated = await this.prisma.tradeConfirmation.update({
            where: { id: request.confirmationId },
            data: updates
        });
        // Generate settlement instruction if affirmed
        if (request.confirmationStatus === PostTradeProcessing_1.TradeConfirmationStatus.AFFIRMED) {
            await this.generateSettlementInstruction(request.confirmationId, tenantId, userId);
        }
        // Publish event
        await this.kafkaService.publishEvent('trade-confirmation-updated', {
            confirmationId: request.confirmationId,
            status: request.confirmationStatus,
            tenantId,
            timestamp: new Date().toISOString()
        });
        return updated;
    }
    async searchTradeConfirmations(request, tenantId) {
        const where = { tenantId };
        // Apply filters
        if (request.portfolioIds && request.portfolioIds.length > 0) {
            where.trade = { portfolioId: { in: request.portfolioIds } };
        }
        if (request.securityIds && request.securityIds.length > 0) {
            where.securityId = { in: request.securityIds };
        }
        if (request.counterpartyIds && request.counterpartyIds.length > 0) {
            where.counterpartyId = { in: request.counterpartyIds };
        }
        if (request.confirmationStatuses && request.confirmationStatuses.length > 0) {
            where.confirmationStatus = { in: request.confirmationStatuses };
        }
        if (request.fromDate || request.toDate) {
            where.tradeDate = {};
            if (request.fromDate)
                where.tradeDate.gte = request.fromDate;
            if (request.toDate)
                where.tradeDate.lte = request.toDate;
        }
        const [confirmations, total] = await Promise.all([
            this.prisma.tradeConfirmation.findMany({
                where,
                include: {
                    trade: true,
                    settlementInstruction: true
                },
                orderBy: [
                    { tradeDate: 'desc' },
                    { createdAt: 'desc' }
                ],
                take: request.limit || 50,
                skip: request.offset || 0
            }),
            this.prisma.tradeConfirmation.count({ where })
        ]);
        return {
            confirmations,
            total,
            hasMore: (request.offset || 0) + confirmations.length < total,
            searchCriteria: request
        };
    }
    // Settlement Instruction Management
    async createSettlementInstruction(request, tenantId, userId) {
        const confirmation = await this.prisma.tradeConfirmation.findFirst({
            where: { id: request.tradeConfirmationId, tenantId },
            include: { trade: true }
        });
        if (!confirmation) {
            throw new Error('Trade confirmation not found');
        }
        const instruction = {
            tenantId,
            tradeConfirmationId: request.tradeConfirmationId,
            instructionType: request.instructionType,
            instructionStatus: PostTradeProcessing_1.SettlementInstructionStatus.PENDING,
            settlementDate: confirmation.settlementDate,
            securityId: confirmation.securityId,
            quantity: confirmation.quantity,
            settlementAmount: confirmation.netAmount,
            settlementCurrency: 'USD', // Default, would get from instrument
            deliveryAccount: request.deliveryAccount,
            receiveAccount: request.receiveAccount,
            cashAccount: request.cashAccount,
            priority: request.priority || 3,
            automaticRetry: true,
            maxRetries: 3,
            retryCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId
        };
        const created = await this.prisma.settlementInstruction.create({
            data: instruction
        });
        // Send to custodian
        await this.sendSettlementInstructionToCustodian(created.id, tenantId);
        return created;
    }
    async generateSettlementInstruction(confirmationId, tenantId, userId) {
        const confirmation = await this.prisma.tradeConfirmation.findFirst({
            where: { id: confirmationId, tenantId },
            include: { trade: true }
        });
        if (!confirmation) {
            throw new Error('Trade confirmation not found');
        }
        // Determine instruction type based on trade side
        const instructionType = confirmation.trade.tradeSide === 'BUY' ?
            'RVP' : 'DVP'; // Receive vs Payment for buys, Delivery vs Payment for sells
        return await this.createSettlementInstruction({
            tradeConfirmationId: confirmationId,
            instructionType: instructionType,
            priority: 2 // High priority for auto-generated
        }, tenantId, userId);
    }
    // Trade Break Management
    async createTradeBreak(request, tenantId, userId) {
        const tradeBreak = {
            tenantId,
            tradeId: request.tradeId,
            breakType: request.breakType,
            severity: request.severity,
            status: PostTradeProcessing_1.TradeBreakStatus.OPEN,
            expectedValue: request.expectedValue,
            actualValue: request.actualValue,
            description: request.description,
            assignedTo: request.assignedTo,
            reportedBy: userId,
            reportedAt: new Date(),
            detectedAt: new Date(),
            priority: this.calculateBreakPriority(request.severity),
            slaDeadline: this.calculateSlaDeadline(request.severity),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Calculate discrepancy if numeric values
        if (typeof request.expectedValue === 'number' && typeof request.actualValue === 'number') {
            tradeBreak.discrepancyAmount = Math.abs(request.actualValue - request.expectedValue);
            tradeBreak.discrepancyPercentage =
                (tradeBreak.discrepancyAmount / request.expectedValue) * 100;
        }
        const created = await this.prisma.tradeBreak.create({
            data: tradeBreak
        });
        // Auto-assign based on break type
        if (!request.assignedTo) {
            await this.autoAssignTradeBreak(created.id, tenantId);
        }
        // Send notification for critical breaks
        if (request.severity === PostTradeProcessing_1.TradeBreakSeverity.CRITICAL) {
            await this.sendCriticalBreakNotification(created.id, tenantId);
        }
        // Publish event
        await this.kafkaService.publishEvent('trade-break-created', {
            breakId: created.id,
            tradeId: request.tradeId,
            severity: request.severity,
            tenantId,
            timestamp: new Date().toISOString()
        });
        return created;
    }
    async resolveTradeBreak(breakId, resolutionNotes, tenantId, userId) {
        const resolved = await this.prisma.tradeBreak.update({
            where: { id: breakId },
            data: {
                status: PostTradeProcessing_1.TradeBreakStatus.RESOLVED,
                resolutionNotes,
                resolvedAt: new Date(),
                updatedAt: new Date()
            }
        });
        // Publish event
        await this.kafkaService.publishEvent('trade-break-resolved', {
            breakId,
            tenantId,
            resolvedBy: userId,
            timestamp: new Date().toISOString()
        });
        return resolved;
    }
    // Transaction Cost Analysis
    async runTransactionCostAnalysis(request, tenantId, userId) {
        const order = await this.prisma.order.findFirst({
            where: { id: request.orderId, tenantId },
            include: { executions: true }
        });
        if (!order) {
            throw new Error('Order not found');
        }
        // Get market data for analysis period
        const marketData = await this.getMarketDataForTCA(order.securityId, order.orderDate, tenantId);
        // Calculate benchmark prices
        const benchmarks = await this.calculateTCABenchmarks(order, marketData);
        // Calculate costs
        const costs = await this.calculateTCACosts(order, benchmarks);
        // Calculate performance metrics
        const performance = this.calculateTCAPerformance(order, benchmarks, costs);
        const analysis = {
            tenantId,
            orderId: request.orderId,
            analysisType: request.analysisType,
            analysisDate: new Date(),
            arrivalPrice: benchmarks.arrivalPrice,
            vwapPrice: benchmarks.vwapPrice,
            twapPrice: benchmarks.twapPrice,
            closingPrice: benchmarks.closingPrice,
            averageExecutionPrice: order.averageFillPrice || 0,
            totalExecutedQuantity: order.filledQuantity,
            totalExecutionValue: (order.averageFillPrice || 0) * order.filledQuantity,
            marketImpactCost: costs.marketImpact,
            timingCost: costs.timing,
            spreadCost: costs.spread,
            commissionCost: costs.commission,
            implementationShortfall: performance.implementationShortfall,
            implementationShortfallBps: performance.implementationShortfallBps,
            priceImprovementBps: performance.priceImprovementBps,
            performanceVsVwap: performance.performanceVsVwap,
            performanceVsTwap: performance.performanceVsTwap,
            performanceVsArrival: performance.performanceVsArrival,
            performanceVsClose: performance.performanceVsClose,
            marketVolatility: marketData.volatility,
            averageDailyVolume: marketData.averageDailyVolume,
            marketCapitalization: marketData.marketCap,
            managerPerformance: performance.managerPerformance,
            marketMovement: performance.marketMovement,
            timingDecision: performance.timingDecision,
            dataQualityScore: this.calculateDataQualityScore(order, marketData),
            createdAt: new Date(),
            createdBy: userId
        };
        return await this.prisma.transactionCostAnalysis.create({
            data: analysis
        });
    }
    // Custodian Integration
    async sendCustodianMessage(request, tenantId, userId) {
        const message = {
            tenantId,
            custodianId: request.custodianId,
            messageType: request.messageType,
            messageFormat: 'JSON', // Default format
            messageStatus: PostTradeProcessing_1.CustodianMessageStatus.PENDING,
            messageContent: request.messageContent,
            relatedTradeId: request.relatedTradeId,
            retryCount: 0,
            maxRetries: 3,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const created = await this.prisma.custodianMessage.create({
            data: message
        });
        // Send message to custodian
        await this.transmitMessageToCustodian(created.id, tenantId);
        return created;
    }
    // Regulatory Reporting
    async createRegulatoryReport(request, tenantId, userId) {
        const report = {
            tenantId,
            reportType: request.reportType,
            reportStatus: PostTradeProcessing_1.RegulatoryReportStatus.DRAFT,
            reportingPeriodStart: request.reportingPeriodStart,
            reportingPeriodEnd: request.reportingPeriodEnd,
            reportingDate: new Date(),
            reportData: request.reportData,
            regulatorId: request.regulatorId,
            isAmendment: false,
            preparedBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const created = await this.prisma.regulatoryReport.create({
            data: report
        });
        // Generate report content
        await this.generateRegulatoryReportContent(created.id, tenantId);
        return created;
    }
    // Trade Matching
    async matchTrade(request, tenantId, userId) {
        const internalTrade = await this.prisma.trade.findFirst({
            where: { id: request.internalTradeId, tenantId }
        });
        if (!internalTrade) {
            throw new Error('Internal trade not found');
        }
        // Get external trade data (would come from counterparty/exchange feed)
        const externalTrade = await this.getExternalTradeData(request.externalTradeId);
        // Perform matching logic
        const matchResult = this.performTradeMatching(internalTrade, externalTrade, request);
        const tradeMatch = {
            tenantId,
            internalTradeId: request.internalTradeId,
            externalTradeId: request.externalTradeId,
            matchStatus: matchResult.status,
            matchConfidence: matchResult.confidence,
            instrumentMatched: matchResult.instrumentMatched,
            quantityMatched: matchResult.quantityMatched,
            priceMatched: matchResult.priceMatched,
            settlementDateMatched: matchResult.settlementDateMatched,
            counterpartyMatched: matchResult.counterpartyMatched,
            priceToleranceBps: request.priceToleranceBps || 5,
            quantityToleranceShares: request.quantityToleranceShares || 0,
            dateToleranceDays: request.dateToleranceDays || 0,
            priceDiscrepancy: matchResult.priceDiscrepancy,
            quantityDiscrepancy: matchResult.quantityDiscrepancy,
            dateDiscrepancy: matchResult.dateDiscrepancy,
            matchedAt: new Date(),
            matchedBy: 'AUTOMATIC',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const created = await this.prisma.tradeMatch.create({
            data: tradeMatch
        });
        // Create trade break if not matched
        if (matchResult.status === 'BREAK') {
            await this.createTradeBreakFromMatch(created.id, matchResult, tenantId, userId);
        }
        return created;
    }
    // Dashboard and Analytics
    async getPostTradeProcessingSummary(tenantId) {
        const [totalTradeConfirmations, pendingConfirmations, confirmedTrades, rejectedTrades, totalSettlementInstructions, pendingSettlements, settledInstructions, failedSettlements, totalTradeBreaks, openBreaks, criticalBreaks, avgResolutionTime, regulatoryReportsThisPeriod, pendingReports, submittedReports] = await Promise.all([
            this.prisma.tradeConfirmation.count({ where: { tenantId } }),
            this.prisma.tradeConfirmation.count({
                where: { tenantId, confirmationStatus: PostTradeProcessing_1.TradeConfirmationStatus.PENDING }
            }),
            this.prisma.tradeConfirmation.count({
                where: { tenantId, confirmationStatus: PostTradeProcessing_1.TradeConfirmationStatus.CONFIRMED }
            }),
            this.prisma.tradeConfirmation.count({
                where: { tenantId, confirmationStatus: PostTradeProcessing_1.TradeConfirmationStatus.REJECTED }
            }),
            this.prisma.settlementInstruction.count({ where: { tenantId } }),
            this.prisma.settlementInstruction.count({
                where: { tenantId, instructionStatus: PostTradeProcessing_1.SettlementInstructionStatus.PENDING }
            }),
            this.prisma.settlementInstruction.count({
                where: { tenantId, instructionStatus: PostTradeProcessing_1.SettlementInstructionStatus.SETTLED }
            }),
            this.prisma.settlementInstruction.count({
                where: { tenantId, instructionStatus: PostTradeProcessing_1.SettlementInstructionStatus.FAILED }
            }),
            this.prisma.tradeBreak.count({ where: { tenantId } }),
            this.prisma.tradeBreak.count({
                where: { tenantId, status: PostTradeProcessing_1.TradeBreakStatus.OPEN }
            }),
            this.prisma.tradeBreak.count({
                where: { tenantId, severity: PostTradeProcessing_1.TradeBreakSeverity.CRITICAL }
            }),
            this.calculateAverageResolutionTime(tenantId),
            this.prisma.regulatoryReport.count({
                where: {
                    tenantId,
                    reportingPeriodStart: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                }
            }),
            this.prisma.regulatoryReport.count({
                where: { tenantId, reportStatus: PostTradeProcessing_1.RegulatoryReportStatus.PENDING_REVIEW }
            }),
            this.prisma.regulatoryReport.count({
                where: { tenantId, reportStatus: PostTradeProcessing_1.RegulatoryReportStatus.SUBMITTED }
            })
        ]);
        return {
            totalTradeConfirmations,
            pendingConfirmations,
            confirmedTrades,
            rejectedTrades,
            totalSettlementInstructions,
            pendingSettlements,
            settledInstructions,
            failedSettlements,
            totalTradeBreaks,
            openBreaks,
            criticalBreaks,
            averageResolutionTimeHours: avgResolutionTime,
            regulatoryReportsThisPeriod,
            pendingReports,
            submittedReports
        };
    }
    // Private Helper Methods
    generateConfirmationReference() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `CONF-${timestamp}-${random}`.toUpperCase();
    }
    async getCounterpartyName(counterpartyId, tenantId) {
        const counterparty = await this.prisma.counterparty.findFirst({
            where: { id: counterpartyId, tenantId }
        });
        return counterparty?.name || 'Unknown Counterparty';
    }
    async sendTradeConfirmation(confirmationId, tenantId) {
        // Implementation would send confirmation electronically
        await this.prisma.tradeConfirmation.update({
            where: { id: confirmationId },
            data: {
                confirmationSentAt: new Date(),
                updatedAt: new Date()
            }
        });
    }
    async sendSettlementInstructionToCustodian(instructionId, tenantId) {
        // Implementation would send instruction to custodian
        await this.prisma.settlementInstruction.update({
            where: { id: instructionId },
            data: {
                instructionStatus: PostTradeProcessing_1.SettlementInstructionStatus.SENT,
                sentToCustodianAt: new Date(),
                updatedAt: new Date()
            }
        });
    }
    calculateBreakPriority(severity) {
        switch (severity) {
            case PostTradeProcessing_1.TradeBreakSeverity.CRITICAL: return 1;
            case PostTradeProcessing_1.TradeBreakSeverity.HIGH: return 2;
            case PostTradeProcessing_1.TradeBreakSeverity.MEDIUM: return 3;
            case PostTradeProcessing_1.TradeBreakSeverity.LOW: return 4;
            default: return 3;
        }
    }
    calculateSlaDeadline(severity) {
        const deadline = new Date();
        switch (severity) {
            case PostTradeProcessing_1.TradeBreakSeverity.CRITICAL:
                deadline.setHours(deadline.getHours() + 2);
                break;
            case PostTradeProcessing_1.TradeBreakSeverity.HIGH:
                deadline.setHours(deadline.getHours() + 4);
                break;
            case PostTradeProcessing_1.TradeBreakSeverity.MEDIUM:
                deadline.setDate(deadline.getDate() + 1);
                break;
            case PostTradeProcessing_1.TradeBreakSeverity.LOW:
                deadline.setDate(deadline.getDate() + 3);
                break;
        }
        return deadline;
    }
    async autoAssignTradeBreak(breakId, tenantId) {
        // Implementation would assign based on break type and team availability
    }
    async sendCriticalBreakNotification(breakId, tenantId) {
        // Implementation would send urgent notifications
    }
    async getMarketDataForTCA(securityId, analysisDate, tenantId) {
        // Implementation would retrieve market data for TCA
        return {
            volatility: 0.2,
            averageDailyVolume: 1000000,
            marketCap: 50000000000
        };
    }
    async calculateTCABenchmarks(order, marketData) {
        // Implementation would calculate benchmark prices
        return {
            arrivalPrice: order.orderPrice || 100,
            vwapPrice: 100.50,
            twapPrice: 100.25,
            closingPrice: 100.75
        };
    }
    async calculateTCACosts(order, benchmarks) {
        // Implementation would calculate cost components
        return {
            marketImpact: 0.05,
            timing: 0.03,
            spread: 0.02,
            commission: 0.01
        };
    }
    calculateTCAPerformance(order, benchmarks, costs) {
        // Implementation would calculate performance metrics
        return {
            implementationShortfall: 0.11,
            implementationShortfallBps: 11,
            priceImprovementBps: -2,
            performanceVsVwap: -0.5,
            performanceVsTwap: -0.25,
            performanceVsArrival: 0,
            performanceVsClose: -0.75,
            managerPerformance: 0.02,
            marketMovement: 0.05,
            timingDecision: 0.04
        };
    }
    calculateDataQualityScore(order, marketData) {
        // Implementation would assess data quality
        return 85;
    }
    async transmitMessageToCustodian(messageId, tenantId) {
        // Implementation would transmit message to custodian
        await this.prisma.custodianMessage.update({
            where: { id: messageId },
            data: {
                messageStatus: PostTradeProcessing_1.CustodianMessageStatus.SENT,
                sentAt: new Date(),
                updatedAt: new Date()
            }
        });
    }
    async generateRegulatoryReportContent(reportId, tenantId) {
        // Implementation would generate report content
    }
    async getExternalTradeData(externalTradeId) {
        // Implementation would retrieve external trade data
        return {};
    }
    performTradeMatching(internalTrade, externalTrade, request) {
        // Implementation would perform trade matching logic
        return {
            status: 'MATCHED',
            confidence: 95,
            instrumentMatched: true,
            quantityMatched: true,
            priceMatched: true,
            settlementDateMatched: true,
            counterpartyMatched: true
        };
    }
    async createTradeBreakFromMatch(matchId, matchResult, tenantId, userId) {
        // Implementation would create trade break from failed match
    }
    async calculateAverageResolutionTime(tenantId) {
        // Implementation would calculate average resolution time
        return 24; // hours
    }
}
exports.PostTradeProcessingService = PostTradeProcessingService;

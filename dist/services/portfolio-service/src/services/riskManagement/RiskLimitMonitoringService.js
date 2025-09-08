"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskLimitMonitoringService = void 0;
// import { KafkaProducer } from '../../utils/kafka/producer'; // TODO: Implement Kafka integration
const logger_1 = require("../../utils/logger");
class RiskLimitMonitoringService {
    prisma;
    kafkaProducer; // TODO: Implement Kafka integration
    logger;
    constructor(prisma, kafkaProducer = null, // TODO: Implement Kafka integration
    customLogger = logger_1.logger) {
        this.prisma = prisma;
        this.kafkaProducer = kafkaProducer; // TODO: Implement Kafka integration
        this.logger = customLogger;
    }
    async monitorRiskLimits(request) {
        try {
            this.logger.info('Starting risk limit monitoring', {
                portfolioId: request.portfolioId,
                entityId: request.entityId
            });
            const startTime = Date.now();
            const portfolioData = await this.getPortfolioData(request.portfolioId, request.asOfDate);
            const applicableLimits = await this.getApplicableLimits(request);
            const currentRiskMetrics = await this.calculateCurrentRiskMetrics(portfolioData, request);
            const limitUtilizations = await this.calculateLimitUtilizations(applicableLimits, currentRiskMetrics);
            const breaches = await this.identifyBreaches(limitUtilizations);
            const alerts = await this.generateAlerts(breaches, limitUtilizations);
            const escalations = await this.processEscalations(breaches, request);
            const approvals = await this.checkRequiredApprovals(limitUtilizations, breaches);
            const trends = await this.analyzeLimitTrends(request.portfolioId, applicableLimits);
            const recommendations = await this.generateRecommendations(limitUtilizations, breaches, trends);
            const consolidatedLimits = await this.calculateConsolidatedLimits(applicableLimits, limitUtilizations);
            const assessment = {
                id: `risk_limit_assessment_${Date.now()}`,
                portfolioId: request.portfolioId,
                entityId: request.entityId,
                tenantId: request.tenantId,
                assessmentDate: new Date(),
                asOfDate: request.asOfDate,
                totalLimitsMonitored: applicableLimits.length,
                totalBreaches: breaches.length,
                criticalBreaches: breaches.filter(b => b.severity === 'CRITICAL').length,
                overallUtilizationPercentage: this.calculateOverallUtilization(limitUtilizations),
                riskLimits: applicableLimits,
                currentRiskMetrics,
                limitUtilizations,
                breaches,
                alerts,
                escalations,
                approvals,
                trends,
                recommendations,
                consolidatedLimits,
                calculationTime: Date.now() - startTime,
                createdAt: new Date(),
                assessedBy: request.userId
            };
            // Store assessment in database
            await this.storeAssessment(assessment);
            // Publish event (if Kafka is available)
            // TODO: Implement Kafka integration
            this.logger.info('Risk limits assessed', {
                portfolioId: request.portfolioId,
                assessmentId: assessment.id,
                totalBreaches: assessment.totalBreaches
            });
            // Send immediate alerts for critical breaches
            for (const breach of breaches.filter(b => b.severity === 'CRITICAL')) {
                await this.sendImmediateAlert(breach, assessment);
            }
            this.logger.info('Risk limit monitoring completed', {
                portfolioId: request.portfolioId,
                assessmentId: assessment.id,
                totalBreaches: assessment.totalBreaches,
                criticalBreaches: assessment.criticalBreaches
            });
            return assessment;
        }
        catch (error) {
            this.logger.error('Error in risk limit monitoring', { error, request });
            throw new Error(`Risk limit monitoring failed: ${error.message}`);
        }
    }
    async monitorAllPortfolioLimits(request) {
        try {
            const portfolios = await this.getAllPortfolios(request.entityId);
            const assessments = [];
            for (const portfolio of portfolios) {
                const portfolioRequest = {
                    ...request,
                    portfolioId: portfolio.id
                };
                const assessment = await this.monitorRiskLimits(portfolioRequest);
                assessments.push(assessment);
            }
            // Generate entity-level consolidated report
            const consolidatedReport = await this.generateConsolidatedReport(assessments, request);
            // Publish entity-level event (if Kafka is available)
            // TODO: Implement Kafka integration
            this.logger.info('Entity risk limits assessed', {
                entityId: request.entityId,
                portfolioCount: assessments.length,
                totalBreaches: assessments.reduce((sum, a) => sum + a.totalBreaches, 0)
            });
            return assessments;
        }
        catch (error) {
            this.logger.error('Error in monitoring all portfolio limits', { error, request });
            throw new Error(`All portfolio limit monitoring failed: ${error.message}`);
        }
    }
    async getPortfolioData(portfolioId, asOfDate) {
        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                positions: {
                    include: {
                    // security: true // Simplified include since detailed relations may not exist
                    },
                    where: {
                        createdAt: {
                            lte: asOfDate
                        }
                    }
                },
                transactions: {
                    where: {
                        tradeDate: {
                            lte: asOfDate
                        }
                    }
                }
            }
        });
        if (!portfolio) {
            throw new Error(`Portfolio ${portfolioId} not found`);
        }
        return portfolio;
    }
    async getApplicableLimits(request) {
        // Implementation would fetch applicable limits from database based on hierarchy
        const limits = [];
        // Portfolio-level limits - cast as any since properties don't match Prisma schema
        limits.push({
            id: `limit_var_${request.portfolioId}`,
            name: 'Daily VaR Limit',
            type: 'VALUE_AT_RISK',
            scope: 'PORTFOLIO',
            entityId: request.portfolioId,
            currency: 'USD',
            limitValue: 5000000,
            softLimitValue: 4000000,
            warningThreshold: 0.8,
            breachThreshold: 1.0,
            escalationThreshold: 1.2,
            measurementMethod: 'ABSOLUTE',
            timeHorizon: '1D',
            confidenceLevel: 0.95,
            isActive: true,
            effectiveDate: new Date('2024-01-01'),
            expiryDate: new Date('2024-12-31'),
            reviewFrequency: 'QUARTERLY',
            lastReviewDate: new Date(),
            nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            approvedBy: 'Risk Committee',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        limits.push({
            id: `limit_concentration_${request.portfolioId}`,
            name: 'Single Issuer Concentration Limit',
            type: 'CONCENTRATION',
            scope: 'PORTFOLIO',
            entityId: request.portfolioId,
            currency: 'USD',
            limitValue: 0.10, // 10% of portfolio
            softLimitValue: 0.08, // 8% soft limit
            warningThreshold: 0.8,
            breachThreshold: 1.0,
            escalationThreshold: 1.2,
            measurementMethod: 'PERCENTAGE',
            timeHorizon: 'INSTANTANEOUS',
            isActive: true,
            effectiveDate: new Date('2024-01-01'),
            expiryDate: new Date('2024-12-31'),
            reviewFrequency: 'QUARTERLY',
            lastReviewDate: new Date(),
            nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            approvedBy: 'Risk Committee',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        limits.push({
            id: `limit_credit_${request.portfolioId}`,
            name: 'Credit Risk Limit',
            type: 'CREDIT_RISK',
            scope: 'PORTFOLIO',
            entityId: request.portfolioId,
            currency: 'USD',
            limitValue: 15000000,
            softLimitValue: 12000000,
            warningThreshold: 0.8,
            breachThreshold: 1.0,
            escalationThreshold: 1.2,
            measurementMethod: 'ABSOLUTE',
            timeHorizon: 'INSTANTANEOUS',
            isActive: true,
            effectiveDate: new Date('2024-01-01'),
            expiryDate: new Date('2024-12-31'),
            reviewFrequency: 'MONTHLY',
            lastReviewDate: new Date(),
            nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            approvedBy: 'Risk Committee',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        limits.push({
            id: `limit_liquidity_${request.portfolioId}`,
            name: 'Liquidity Risk Limit',
            type: 'LIQUIDITY_RISK',
            scope: 'PORTFOLIO',
            entityId: request.portfolioId,
            currency: 'USD',
            limitValue: 0.20, // 20% illiquid positions
            softLimitValue: 0.15, // 15% soft limit
            warningThreshold: 0.8,
            breachThreshold: 1.0,
            escalationThreshold: 1.2,
            measurementMethod: 'PERCENTAGE',
            timeHorizon: 'INSTANTANEOUS',
            isActive: true,
            effectiveDate: new Date('2024-01-01'),
            expiryDate: new Date('2024-12-31'),
            reviewFrequency: 'MONTHLY',
            lastReviewDate: new Date(),
            nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            approvedBy: 'Risk Committee',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        limits.push({
            id: `limit_leverage_${request.portfolioId}`,
            name: 'Leverage Limit',
            type: 'LEVERAGE',
            scope: 'PORTFOLIO',
            entityId: request.portfolioId,
            currency: 'USD',
            limitValue: 2.0, // 2:1 leverage ratio
            softLimitValue: 1.8, // 1.8:1 soft limit
            warningThreshold: 0.9,
            breachThreshold: 1.0,
            escalationThreshold: 1.1,
            measurementMethod: 'RATIO',
            timeHorizon: 'INSTANTANEOUS',
            isActive: true,
            effectiveDate: new Date('2024-01-01'),
            expiryDate: new Date('2024-12-31'),
            reviewFrequency: 'DAILY',
            lastReviewDate: new Date(),
            nextReviewDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            approvedBy: 'Portfolio Manager',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return limits.filter(limit => limit.isActive &&
            limit.effectiveDate <= request.asOfDate &&
            limit.expiryDate >= request.asOfDate);
    }
    async calculateCurrentRiskMetrics(portfolioData, request) {
        const metrics = [];
        // Calculate VaR
        const portfolioValue = portfolioData.positions.reduce((sum, pos) => sum + pos.marketValue, 0);
        const varValue = portfolioValue * 0.025; // Simplified 2.5% VaR
        metrics.push({
            metricType: 'VALUE_AT_RISK',
            value: varValue,
            currency: 'USD',
            asOfDate: request.asOfDate,
            calculationMethod: 'HISTORICAL_SIMULATION',
            confidenceLevel: 0.95,
            timeHorizon: '1D'
        });
        // Calculate concentration metrics
        const issuerConcentrations = this.calculateIssuerConcentrations(portfolioData.positions);
        const maxConcentration = Math.max(...Object.values(issuerConcentrations));
        metrics.push({
            metricType: 'CONCENTRATION',
            value: maxConcentration,
            currency: 'USD',
            asOfDate: request.asOfDate,
            calculationMethod: 'POSITION_WEIGHTED',
            additionalData: { issuerConcentrations }
        });
        // Calculate credit risk
        const creditExposure = this.calculateCreditExposure(portfolioData.positions);
        metrics.push({
            metricType: 'CREDIT_RISK',
            value: creditExposure,
            currency: 'USD',
            asOfDate: request.asOfDate,
            calculationMethod: 'EXPOSURE_WEIGHTED'
        });
        // Calculate liquidity risk
        const illiquidPercentage = this.calculateIlliquidPercentage(portfolioData.positions);
        metrics.push({
            metricType: 'LIQUIDITY_RISK',
            value: illiquidPercentage,
            currency: 'USD',
            asOfDate: request.asOfDate,
            calculationMethod: 'LIQUIDITY_WEIGHTED'
        });
        // Calculate leverage
        const leverage = this.calculateLeverage(portfolioData);
        metrics.push({
            metricType: 'LEVERAGE',
            value: leverage,
            currency: 'USD',
            asOfDate: request.asOfDate,
            calculationMethod: 'GROSS_NOTIONAL'
        });
        return metrics;
    }
    async calculateLimitUtilizations(limits, metrics) {
        const utilizations = [];
        for (const limit of limits) {
            const relevantMetric = metrics.find(m => this.isMetricApplicableToLimit(m, limit));
            if (relevantMetric) {
                const currentValue = relevantMetric.value;
                const utilizationValue = this.calculateUtilizationValue(currentValue, limit);
                const utilizationPercentage = (utilizationValue / limit.limitValue) * 100;
                const softUtilizationPercentage = limit.softLimitValue ?
                    (utilizationValue / limit.softLimitValue) * 100 : utilizationPercentage;
                utilizations.push({
                    id: `utilization_${limit.id}`,
                    limitId: limit.id,
                    limitName: limit.name,
                    limitType: limit.type,
                    limitValue: limit.limitValue,
                    softLimitValue: limit.softLimitValue,
                    currentValue: utilizationValue,
                    utilizationPercentage,
                    softUtilizationPercentage,
                    availableCapacity: Math.max(limit.limitValue - utilizationValue, 0),
                    timeToLimit: this.calculateTimeToLimit(currentValue, limit),
                    lastUpdated: new Date(),
                    trend: await this.calculateUtilizationTrend(limit.id),
                    isBreached: utilizationPercentage >= (limit.breachThreshold * 100),
                    isSoftBreached: limit.softLimitValue ?
                        softUtilizationPercentage >= (limit.breachThreshold * 100) : false,
                    isWarning: utilizationPercentage >= (limit.warningThreshold * 100),
                    daysToReview: this.calculateDaysToReview(limit.nextReviewDate)
                });
            }
        }
        return utilizations;
    }
    async identifyBreaches(utilizations) {
        const breaches = [];
        for (const utilization of utilizations) {
            if (utilization.isBreached || utilization.isSoftBreached) {
                const severity = this.determineSeverity(utilization);
                const timeInBreach = await this.calculateTimeInBreach(utilization.limitId);
                breaches.push({
                    id: `breach_${utilization.limitId}_${Date.now()}`,
                    limitId: utilization.limitId,
                    limitName: utilization.limitName,
                    limitType: utilization.limitType,
                    breachType: utilization.isBreached ? 'HARD_LIMIT' : 'SOFT_LIMIT',
                    severity,
                    breachValue: utilization.currentValue,
                    limitValue: utilization.isBreached ? utilization.limitValue : utilization.softLimitValue,
                    excessAmount: utilization.currentValue - (utilization.isBreached ?
                        utilization.limitValue : utilization.softLimitValue),
                    excessPercentage: ((utilization.currentValue - (utilization.isBreached ?
                        utilization.limitValue : utilization.softLimitValue)) /
                        (utilization.isBreached ? utilization.limitValue : utilization.softLimitValue)) * 100,
                    breachDate: new Date(),
                    timeInBreach,
                    isEscalated: severity === 'CRITICAL',
                    escalationLevel: this.determineEscalationLevel(severity, timeInBreach),
                    requiresApproval: severity !== 'LOW',
                    impactAssessment: await this.assessBreachImpact(utilization),
                    recommendedActions: this.generateBreachActions(utilization, severity)
                });
            }
        }
        return breaches;
    }
    async generateAlerts(breaches, utilizations) {
        const alerts = [];
        // Breach alerts
        for (const breach of breaches) {
            alerts.push({
                id: `alert_breach_${breach.id}`,
                type: 'LIMIT_BREACH',
                severity: breach.severity,
                limitId: breach.limitId,
                limitName: breach.limitName,
                message: `${breach.limitName} has been breached`,
                description: `Current value ${breach.breachValue.toLocaleString()} exceeds limit of ${breach.limitValue.toLocaleString()}`,
                currentValue: breach.breachValue,
                limitValue: breach.limitValue,
                excessAmount: breach.excessAmount,
                isActive: true,
                requiresAction: true,
                createdAt: new Date(),
                acknowledgedAt: null,
                acknowledgedBy: null,
                resolvedAt: null,
                resolvedBy: null
            });
        }
        // Warning alerts
        for (const utilization of utilizations.filter(u => u.isWarning && !u.isBreached && !u.isSoftBreached)) {
            alerts.push({
                id: `alert_warning_${utilization.limitId}`,
                type: 'LIMIT_WARNING',
                severity: 'MEDIUM',
                limitId: utilization.limitId,
                limitName: utilization.limitName,
                message: `${utilization.limitName} approaching limit`,
                description: `Current utilization ${utilization.utilizationPercentage.toFixed(1)}% exceeds warning threshold`,
                currentValue: utilization.currentValue,
                limitValue: utilization.limitValue,
                utilizationPercentage: utilization.utilizationPercentage,
                isActive: true,
                requiresAction: false,
                createdAt: new Date(),
                acknowledgedAt: null,
                acknowledgedBy: null,
                resolvedAt: null,
                resolvedBy: null
            });
        }
        // Capacity alerts
        const lowCapacityUtils = utilizations.filter(u => u.availableCapacity < (u.limitValue * 0.05) // Less than 5% capacity remaining
        );
        for (const utilization of lowCapacityUtils) {
            alerts.push({
                id: `alert_capacity_${utilization.limitId}`,
                type: 'LOW_CAPACITY',
                severity: 'MEDIUM',
                limitId: utilization.limitId,
                limitName: utilization.limitName,
                message: `Low available capacity for ${utilization.limitName}`,
                description: `Only ${utilization.availableCapacity.toLocaleString()} capacity remaining`,
                currentValue: utilization.currentValue,
                limitValue: utilization.limitValue,
                availableCapacity: utilization.availableCapacity,
                isActive: true,
                requiresAction: false,
                createdAt: new Date(),
                acknowledgedAt: null,
                acknowledgedBy: null,
                resolvedAt: null,
                resolvedBy: null
            });
        }
        return alerts;
    }
    async processEscalations(breaches, request) {
        const escalations = [];
        for (const breach of breaches.filter(b => b.isEscalated)) {
            escalations.push({
                id: `escalation_${breach.id}`,
                breachId: breach.id,
                limitId: breach.limitId,
                limitName: breach.limitName,
                escalationLevel: breach.escalationLevel,
                escalationDate: new Date(),
                escalatedTo: this.getEscalationRecipient(breach.escalationLevel),
                escalationReason: `${breach.limitName} breach requires ${breach.escalationLevel} level attention`,
                status: 'PENDING',
                dueDate: this.calculateEscalationDueDate(breach.escalationLevel),
                acknowledgedAt: null,
                acknowledgedBy: null,
                resolvedAt: null,
                resolvedBy: null,
                resolutionNotes: null
            });
        }
        return escalations;
    }
    async checkRequiredApprovals(utilizations, breaches) {
        const approvals = [];
        for (const breach of breaches.filter(b => b.requiresApproval)) {
            approvals.push({
                id: `approval_${breach.id}`,
                breachId: breach.id,
                limitId: breach.limitId,
                limitName: breach.limitName,
                approvalType: 'BREACH_OVERRIDE',
                requestedBy: 'system',
                requestDate: new Date(),
                requiredApprover: this.getRequiredApprover(breach.severity),
                approvalReason: `Approval required for ${breach.limitName} breach`,
                status: 'PENDING',
                dueDate: this.calculateApprovalDueDate(breach.severity),
                approvedAt: null,
                approvedBy: null,
                rejectedAt: null,
                rejectedBy: null,
                approvalNotes: null
            });
        }
        return approvals;
    }
    async analyzeLimitTrends(portfolioId, limits) {
        const trends = [];
        for (const limit of limits) {
            // Implementation would fetch historical utilization data
            trends.push({
                limitId: limit.id,
                limitName: limit.name,
                timeFrame: '30D',
                currentUtilization: 65, // Placeholder
                averageUtilization: 58,
                peakUtilization: 85,
                minimumUtilization: 45,
                trendDirection: 'INCREASING',
                volatility: 12.5,
                breachFrequency: 2,
                daysInBreach: 3,
                forecastedUtilization: 70,
                riskScore: 7.2
            });
        }
        return trends;
    }
    async generateRecommendations(utilizations, breaches, trends) {
        const recommendations = [];
        // Recommendations for breached limits
        for (const breach of breaches) {
            recommendations.push({
                id: `rec_breach_${breach.id}`,
                type: 'BREACH_RESOLUTION',
                priority: breach.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
                limitId: breach.limitId,
                limitName: breach.limitName,
                title: `Resolve ${breach.limitName} Breach`,
                description: `Immediate action required to bring ${breach.limitName} within acceptable limits`,
                actions: breach.recommendedActions,
                expectedImpact: `Reduce exposure by ${breach.excessAmount.toLocaleString()}`,
                implementationTimeframe: breach.severity === 'CRITICAL' ? '1 hour' : '1 business day',
                estimatedCost: this.estimateResolutionCost(breach),
                riskReduction: breach.excessAmount
            });
        }
        // Recommendations for high utilization limits
        const highUtilizationLimits = utilizations.filter(u => u.utilizationPercentage > 80 && !u.isBreached);
        for (const utilization of highUtilizationLimits) {
            recommendations.push({
                id: `rec_utilization_${utilization.limitId}`,
                type: 'UTILIZATION_MANAGEMENT',
                priority: 'MEDIUM',
                limitId: utilization.limitId,
                limitName: utilization.limitName,
                title: `Manage ${utilization.limitName} Utilization`,
                description: `High utilization of ${utilization.utilizationPercentage.toFixed(1)}% requires proactive management`,
                actions: [
                    'Monitor utilization closely',
                    'Consider increasing limit if justified',
                    'Implement early warning alerts',
                    'Review portfolio composition'
                ],
                expectedImpact: 'Prevent future limit breaches',
                implementationTimeframe: '1 week',
                estimatedCost: 10000,
                riskReduction: utilization.currentValue * 0.1
            });
        }
        // Recommendations based on trends
        const increasingTrends = trends.filter(t => t.trendDirection === 'INCREASING' && t.forecastedUtilization > 90);
        for (const trend of increasingTrends) {
            recommendations.push({
                id: `rec_trend_${trend.limitId}`,
                type: 'TREND_MANAGEMENT',
                priority: 'LOW',
                limitId: trend.limitId,
                limitName: trend.limitName,
                title: `Address Increasing Trend for ${trend.limitName}`,
                description: `Utilization trend indicates potential future breach risk`,
                actions: [
                    'Analyze drivers of increasing utilization',
                    'Implement trend monitoring alerts',
                    'Consider limit adjustments',
                    'Review risk management strategies'
                ],
                expectedImpact: 'Prevent forecasted limit breaches',
                implementationTimeframe: '2 weeks',
                estimatedCost: 25000,
                riskReduction: trend.forecastedUtilization * 0.2
            });
        }
        return recommendations;
    }
    async calculateConsolidatedLimits(limits, utilizations) {
        const consolidated = [];
        // Group by limit type
        const limitsByType = this.groupLimitsByType(limits);
        for (const [type, typeLimits] of limitsByType.entries()) {
            const typeUtilizations = utilizations.filter(u => typeLimits.some(limit => limit.id === u.limitId));
            const totalLimit = typeLimits.reduce((sum, limit) => sum + limit.limitValue, 0);
            const totalUtilization = typeUtilizations.reduce((sum, util) => sum + util.currentValue, 0);
            const utilizationPercentage = totalLimit > 0 ? (totalUtilization / totalLimit) * 100 : 0;
            consolidated.push({
                limitType: type,
                numberOfLimits: typeLimits.length,
                totalLimitValue: totalLimit,
                totalUtilization,
                utilizationPercentage,
                availableCapacity: totalLimit - totalUtilization,
                numberOfBreaches: typeUtilizations.filter(u => u.isBreached).length,
                averageUtilization: typeUtilizations.length > 0 ?
                    typeUtilizations.reduce((sum, u) => sum + u.utilizationPercentage, 0) / typeUtilizations.length : 0,
                maxUtilization: Math.max(...typeUtilizations.map(u => u.utilizationPercentage)),
                minUtilization: Math.min(...typeUtilizations.map(u => u.utilizationPercentage))
            });
        }
        return consolidated;
    }
    // Helper methods
    calculateIssuerConcentrations(positions) {
        const concentrations = {};
        const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
        positions.forEach(position => {
            const issuer = position.security.issuer || 'Unknown';
            concentrations[issuer] = (concentrations[issuer] || 0) + (position.marketValue / totalValue);
        });
        return concentrations;
    }
    calculateCreditExposure(positions) {
        return positions
            .filter(pos => pos.security.assetClass === 'FIXED_INCOME' || pos.security.assetClass === 'CORPORATE_BOND')
            .reduce((sum, pos) => sum + pos.marketValue, 0);
    }
    calculateIlliquidPercentage(positions) {
        const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
        const illiquidValue = positions
            .filter(pos => this.isIlliquid(pos.security))
            .reduce((sum, pos) => sum + pos.marketValue, 0);
        return totalValue > 0 ? (illiquidValue / totalValue) * 100 : 0;
    }
    calculateLeverage(portfolioData) {
        const netValue = portfolioData.positions.reduce((sum, pos) => sum + pos.marketValue, 0);
        const grossValue = portfolioData.positions.reduce((sum, pos) => sum + Math.abs(pos.marketValue), 0);
        return netValue > 0 ? grossValue / netValue : 0;
    }
    isIlliquid(security) {
        const illiquidTypes = ['PRIVATE_EQUITY', 'HEDGE_FUND', 'REAL_ESTATE', 'COMMODITY'];
        return illiquidTypes.includes(security.assetClass) ||
            (security.liquidity && security.liquidity === 'ILLIQUID');
    }
    isMetricApplicableToLimit(metric, limit) {
        const metricToLimitMap = {
            'VALUE_AT_RISK': ['VALUE_AT_RISK'],
            'CONCENTRATION': ['CONCENTRATION'],
            'CREDIT_RISK': ['CREDIT_RISK'],
            'LIQUIDITY_RISK': ['LIQUIDITY_RISK'],
            'LEVERAGE': ['LEVERAGE']
        };
        return metricToLimitMap[metric.metricType]?.includes(limit.type) || false;
    }
    calculateUtilizationValue(currentValue, limit) {
        if (limit.measurementMethod === 'ABSOLUTE') {
            return currentValue;
        }
        else if (limit.measurementMethod === 'PERCENTAGE') {
            return currentValue; // Already in percentage form
        }
        else if (limit.measurementMethod === 'RATIO') {
            return currentValue;
        }
        return currentValue;
    }
    calculateTimeToLimit(currentValue, limit) {
        // Simplified calculation - would use trend analysis in practice
        const utilizationRate = 0.01; // 1% per day
        const remainingCapacity = limit.limitValue - currentValue;
        return remainingCapacity > 0 ? remainingCapacity / (currentValue * utilizationRate) : 0;
    }
    async calculateUtilizationTrend(limitId) {
        // Would analyze historical data
        return 'STABLE';
    }
    calculateDaysToReview(nextReviewDate) {
        const today = new Date();
        const diffTime = nextReviewDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    determineSeverity(utilization) {
        if (utilization.utilizationPercentage >= 150)
            return 'CRITICAL';
        if (utilization.utilizationPercentage >= 120)
            return 'HIGH';
        if (utilization.utilizationPercentage >= 100)
            return 'MEDIUM';
        return 'LOW';
    }
    async calculateTimeInBreach(limitId) {
        // Would fetch historical breach data
        return 0; // Hours in breach
    }
    determineEscalationLevel(severity, timeInBreach) {
        if (severity === 'CRITICAL' || timeInBreach > 24)
            return 'EXECUTIVE';
        if (severity === 'HIGH' || timeInBreach > 4)
            return 'SENIOR_MANAGEMENT';
        if (severity === 'MEDIUM')
            return 'MANAGEMENT';
        return 'OPERATIONAL';
    }
    async assessBreachImpact(utilization) {
        return `Moderate impact on risk profile - ${utilization.limitName} breach requires attention`;
    }
    generateBreachActions(utilization, severity) {
        const actions = [];
        if (utilization.limitType === 'VALUE_AT_RISK') {
            actions.push('Reduce portfolio risk through position sizing');
            actions.push('Hedge key risk factors');
            actions.push('Consider temporary limit increase approval');
        }
        else if (utilization.limitType === 'CONCENTRATION') {
            actions.push('Diversify concentrated positions');
            actions.push('Reduce exposure to over-concentrated issuers');
            actions.push('Review position sizing limits');
        }
        else if (utilization.limitType === 'CREDIT_RISK') {
            actions.push('Reduce credit exposure');
            actions.push('Increase credit quality of holdings');
            actions.push('Consider credit hedging strategies');
        }
        if (severity === 'CRITICAL') {
            actions.unshift('IMMEDIATE ACTION REQUIRED');
        }
        return actions;
    }
    getEscalationRecipient(level) {
        const recipients = {
            'OPERATIONAL': 'Risk Analyst',
            'MANAGEMENT': 'Risk Manager',
            'SENIOR_MANAGEMENT': 'Head of Risk',
            'EXECUTIVE': 'Chief Risk Officer'
        };
        return recipients[level];
    }
    calculateEscalationDueDate(level) {
        const hoursMap = {
            'OPERATIONAL': 4,
            'MANAGEMENT': 2,
            'SENIOR_MANAGEMENT': 1,
            'EXECUTIVE': 0.5
        };
        return new Date(Date.now() + hoursMap[level] * 60 * 60 * 1000);
    }
    getRequiredApprover(severity) {
        const approvers = {
            'LOW': 'Risk Analyst',
            'MEDIUM': 'Risk Manager',
            'HIGH': 'Head of Risk',
            'CRITICAL': 'Chief Risk Officer'
        };
        return approvers[severity];
    }
    calculateApprovalDueDate(severity) {
        const hoursMap = {
            'LOW': 24,
            'MEDIUM': 8,
            'HIGH': 4,
            'CRITICAL': 1
        };
        return new Date(Date.now() + hoursMap[severity] * 60 * 60 * 1000);
    }
    estimateResolutionCost(breach) {
        // Simplified cost estimation
        const baseCost = 10000;
        const severityMultiplier = {
            'LOW': 1,
            'MEDIUM': 2,
            'HIGH': 4,
            'CRITICAL': 8
        }[breach.severity];
        return baseCost * severityMultiplier;
    }
    groupLimitsByType(limits) {
        const grouped = new Map();
        limits.forEach(limit => {
            if (!grouped.has(limit.type)) {
                grouped.set(limit.type, []);
            }
            grouped.get(limit.type).push(limit);
        });
        return grouped;
    }
    calculateOverallUtilization(utilizations) {
        if (utilizations.length === 0)
            return 0;
        const totalUtilization = utilizations.reduce((sum, util) => sum + util.utilizationPercentage, 0);
        return totalUtilization / utilizations.length;
    }
    async getAllPortfolios(entityId) {
        // Would fetch all portfolios for the entity
        return [
            { id: 'portfolio_1', name: 'Growth Portfolio' },
            { id: 'portfolio_2', name: 'Income Portfolio' },
            { id: 'portfolio_3', name: 'Balanced Portfolio' }
        ];
    }
    async generateConsolidatedReport(assessments, request) {
        const totalLimits = assessments.reduce((sum, a) => sum + a.totalLimitsMonitored, 0);
        const totalBreaches = assessments.reduce((sum, a) => sum + a.totalBreaches, 0);
        const totalCriticalBreaches = assessments.reduce((sum, a) => sum + a.criticalBreaches, 0);
        const avgUtilization = assessments.reduce((sum, a) => sum + a.overallUtilizationPercentage, 0) / assessments.length;
        return {
            id: `consolidated_report_${Date.now()}`,
            entityId: request.entityId,
            tenantId: request.tenantId,
            reportDate: new Date(),
            asOfDate: request.asOfDate,
            portfolioCount: assessments.length,
            totalLimitsMonitored: totalLimits,
            totalBreaches,
            totalCriticalBreaches,
            overallUtilizationPercentage: avgUtilization,
            portfolioAssessments: assessments.map(a => ({
                portfolioId: a.portfolioId,
                totalBreaches: a.totalBreaches,
                criticalBreaches: a.criticalBreaches,
                utilizationPercentage: a.overallUtilizationPercentage
            })),
            executiveSummary: this.generateExecutiveSummary(assessments),
            keyRisks: this.identifyKeyRisks(assessments),
            recommendations: this.generateConsolidatedRecommendations(assessments),
            createdAt: new Date()
        };
    }
    generateExecutiveSummary(assessments) {
        const totalBreaches = assessments.reduce((sum, a) => sum + a.totalBreaches, 0);
        const criticalBreaches = assessments.reduce((sum, a) => sum + a.criticalBreaches, 0);
        if (criticalBreaches > 0) {
            return `URGENT: ${criticalBreaches} critical limit breaches require immediate attention across ${assessments.length} portfolios.`;
        }
        else if (totalBreaches > 0) {
            return `${totalBreaches} limit breaches identified across ${assessments.length} portfolios requiring management attention.`;
        }
        else {
            return `All ${assessments.length} portfolios operating within approved risk limits.`;
        }
    }
    identifyKeyRisks(assessments) {
        const risks = [];
        const totalCriticalBreaches = assessments.reduce((sum, a) => sum + a.criticalBreaches, 0);
        if (totalCriticalBreaches > 0) {
            risks.push(`${totalCriticalBreaches} critical limit breaches requiring immediate action`);
        }
        const highUtilization = assessments.filter(a => a.overallUtilizationPercentage > 80).length;
        if (highUtilization > 0) {
            risks.push(`${highUtilization} portfolios with high limit utilization (>80%)`);
        }
        return risks;
    }
    generateConsolidatedRecommendations(assessments) {
        const recommendations = [];
        const hasBreaches = assessments.some(a => a.totalBreaches > 0);
        if (hasBreaches) {
            recommendations.push('Prioritize resolution of limit breaches across all portfolios');
            recommendations.push('Review and update risk limit framework');
        }
        const highUtilization = assessments.filter(a => a.overallUtilizationPercentage > 70).length;
        if (highUtilization > assessments.length * 0.5) {
            recommendations.push('Consider increasing limits or reducing risk across portfolio suite');
        }
        return recommendations;
    }
    async sendImmediateAlert(breach, assessment) {
        if (this.kafkaProducer) {
            await this.kafkaProducer.publish('critical-limit-breach-alert', {
                portfolioId: assessment.portfolioId,
                entityId: assessment.entityId,
                tenantId: assessment.tenantId,
                breachId: breach.id,
                limitName: breach.limitName,
                severity: breach.severity,
                breachValue: breach.breachValue,
                limitValue: breach.limitValue,
                excessAmount: breach.excessAmount,
                timestamp: new Date()
            });
        }
    }
    async storeAssessment(assessment) {
        // Implementation would store the assessment in the database
        this.logger.info('Storing risk limit assessment', { assessmentId: assessment.id });
    }
}
exports.RiskLimitMonitoringService = RiskLimitMonitoringService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreSettlementRiskChecksService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class PreSettlementRiskChecksService extends events_1.EventEmitter {
    riskLimits;
    complianceRules;
    settlementCapacities;
    riskCheckHistory;
    // Risk check implementations
    RISK_CHECKS = new Map([
        ['POSITION_LIMIT_CHECK', this.checkPositionLimits.bind(this)],
        ['COUNTERPARTY_EXPOSURE_CHECK', this.checkCounterpartyExposure.bind(this)],
        ['CONCENTRATION_LIMIT_CHECK', this.checkConcentrationLimits.bind(this)],
        ['CREDIT_LIMIT_CHECK', this.checkCreditLimits.bind(this)],
        ['SETTLEMENT_CAPACITY_CHECK', this.checkSettlementCapacity.bind(this)],
        ['LIQUIDITY_CHECK', this.checkLiquidity.bind(this)],
        ['REGULATORY_COMPLIANCE_CHECK', this.checkRegulatoryCompliance.bind(this)],
        ['INTERNAL_POLICY_CHECK', this.checkInternalPolicies.bind(this)],
        ['MARKET_HOURS_CHECK', this.checkMarketHours.bind(this)],
        ['SETTLEMENT_DATE_CHECK', this.checkSettlementDate.bind(this)],
        ['PRICE_REASONABLENESS_CHECK', this.checkPriceReasonableness.bind(this)],
        ['CROSS_TRADE_CHECK', this.checkCrossTrades.bind(this)],
        ['WASH_TRADE_CHECK', this.checkWashTrades.bind(this)],
        ['RESTRICTED_SECURITY_CHECK', this.checkRestrictedSecurities.bind(this)],
        ['KYC_AML_CHECK', this.checkKycAml.bind(this)]
    ]);
    constructor() {
        super();
        this.riskLimits = new Map();
        this.complianceRules = new Map();
        this.settlementCapacities = new Map();
        this.riskCheckHistory = new Map();
    }
    async executePreSettlementChecks(order, checkTypes) {
        const startTime = Date.now();
        const suiteId = (0, uuid_1.v4)();
        const checksToRun = checkTypes || Array.from(this.RISK_CHECKS.keys());
        const results = [];
        const suite = {
            suiteId,
            orderId: order.id,
            suiteName: 'Pre-Settlement Risk Checks',
            totalChecks: checksToRun.length,
            passedChecks: 0,
            failedChecks: 0,
            warningChecks: 0,
            overallStatus: 'PENDING',
            canProceed: false,
            requiresApproval: false,
            results: [],
            executedAt: new Date()
        };
        try {
            // Execute each risk check
            for (const checkType of checksToRun) {
                const checkFunction = this.RISK_CHECKS.get(checkType);
                if (checkFunction) {
                    try {
                        const result = await checkFunction(order);
                        results.push(result);
                        // Update counters based on result status
                        switch (result.status) {
                            case 'PASS':
                                suite.passedChecks++;
                                break;
                            case 'FAIL':
                                suite.failedChecks++;
                                break;
                            case 'WARNING':
                                suite.warningChecks++;
                                break;
                        }
                        // Check if approval is required
                        if (result.severity === 'HIGH' || result.severity === 'CRITICAL') {
                            suite.requiresApproval = true;
                        }
                    }
                    catch (error) {
                        // Create failed result for check execution error
                        const errorResult = {
                            checkId: (0, uuid_1.v4)(),
                            orderId: order.id,
                            checkType,
                            status: 'FAIL',
                            severity: 'HIGH',
                            message: `Risk check execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            bypassable: false,
                            executedAt: new Date(),
                            executionTimeMs: 0
                        };
                        results.push(errorResult);
                        suite.failedChecks++;
                        suite.requiresApproval = true;
                    }
                }
            }
            // Determine overall status and whether trade can proceed
            suite.results = results;
            suite.overallStatus = this.determineOverallStatus(results);
            suite.canProceed = this.canTradeProceed(results);
            suite.completedAt = new Date();
            suite.totalExecutionTimeMs = Date.now() - startTime;
            // Store check history
            const history = this.riskCheckHistory.get(order.id) || [];
            history.push(suite);
            this.riskCheckHistory.set(order.id, history);
            this.emit('riskCheckSuiteCompleted', suite);
            // Emit specific events based on results
            if (suite.overallStatus === 'FAIL') {
                this.emit('riskCheckFailed', suite);
            }
            else if (suite.requiresApproval) {
                this.emit('riskCheckRequiresApproval', suite);
            }
            else if (suite.overallStatus === 'PASS') {
                this.emit('riskCheckPassed', suite);
            }
            return suite;
        }
        catch (error) {
            suite.overallStatus = 'FAIL';
            suite.canProceed = false;
            suite.completedAt = new Date();
            suite.totalExecutionTimeMs = Date.now() - startTime;
            this.emit('riskCheckSuiteError', { suite, error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    determineOverallStatus(results) {
        const hasFailed = results.some(r => r.status === 'FAIL');
        const hasWarnings = results.some(r => r.status === 'WARNING');
        const hasPending = results.some(r => r.status === 'PENDING');
        if (hasFailed)
            return 'FAIL';
        if (hasPending)
            return 'PENDING';
        if (hasWarnings)
            return 'WARNING';
        return 'PASS';
    }
    canTradeProceed(results) {
        // Trade cannot proceed if any non-bypassable checks failed
        const criticalFailures = results.filter(r => r.status === 'FAIL' &&
            !r.bypassable &&
            (r.severity === 'HIGH' || r.severity === 'CRITICAL'));
        return criticalFailures.length === 0;
    }
    // Individual Risk Check Implementations
    async checkPositionLimits(order) {
        const startTime = Date.now();
        try {
            const positionLimits = this.getEntityLimits(order.portfolioId, 'POSITION');
            const currentPosition = await this.getCurrentPosition(order.portfolioId, order.securityId);
            const newPosition = order.side === 'BUY' ?
                currentPosition + order.quantity :
                currentPosition - order.quantity;
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Position limits check passed';
            let recommendedAction;
            for (const limit of positionLimits) {
                const utilizationPercentage = Math.abs(newPosition) / limit.limitValue * 100;
                if (utilizationPercentage > limit.breachThreshold) {
                    status = 'FAIL';
                    severity = 'HIGH';
                    message = `Position limit breach: ${utilizationPercentage.toFixed(1)}% of limit`;
                    recommendedAction = 'Reduce order quantity or obtain limit increase approval';
                    break;
                }
                else if (utilizationPercentage > limit.warningThreshold) {
                    status = 'WARNING';
                    severity = 'MEDIUM';
                    message = `Position limit warning: ${utilizationPercentage.toFixed(1)}% of limit`;
                    recommendedAction = 'Monitor position closely';
                }
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'POSITION_LIMIT_CHECK',
                status,
                severity,
                message,
                details: { currentPosition, newPosition, limits: positionLimits.length },
                recommendedAction,
                bypassable: status !== 'FAIL' || severity === 'INFO',
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'POSITION_LIMIT_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkCounterpartyExposure(order) {
        const startTime = Date.now();
        try {
            const exposureLimits = this.getEntityLimits(order.counterpartyId, 'EXPOSURE');
            const currentExposure = await this.getCurrentCounterpartyExposure(order.counterpartyId);
            const orderValue = order.quantity * order.price;
            const newExposure = currentExposure + orderValue;
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Counterparty exposure check passed';
            let recommendedAction;
            let utilizationPercentage = 0;
            for (const limit of exposureLimits) {
                utilizationPercentage = newExposure / limit.limitValue * 100;
                if (utilizationPercentage > limit.breachThreshold) {
                    status = 'FAIL';
                    severity = 'HIGH';
                    message = `Counterparty exposure limit breach: ${utilizationPercentage.toFixed(1)}% of limit`;
                    recommendedAction = 'Reduce order size or require additional collateral';
                    break;
                }
                else if (utilizationPercentage > limit.warningThreshold) {
                    status = 'WARNING';
                    severity = 'MEDIUM';
                    message = `Counterparty exposure warning: ${utilizationPercentage.toFixed(1)}% of limit`;
                    recommendedAction = 'Monitor exposure closely';
                }
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'COUNTERPARTY_EXPOSURE_CHECK',
                status,
                severity,
                message,
                details: { currentExposure, newExposure, orderValue },
                actualValue: utilizationPercentage,
                threshold: exposureLimits[0]?.breachThreshold,
                recommendedAction,
                bypassable: status !== 'FAIL' || severity === 'INFO',
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'COUNTERPARTY_EXPOSURE_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkConcentrationLimits(order) {
        const startTime = Date.now();
        try {
            const concentrationLimits = this.getEntityLimits(order.portfolioId, 'CONCENTRATION');
            const portfolioValue = await this.getPortfolioValue(order.portfolioId);
            const securityValue = await this.getCurrentSecurityValue(order.portfolioId, order.securityId);
            const orderValue = order.quantity * order.price;
            const newSecurityValue = order.side === 'BUY' ? securityValue + orderValue : securityValue - orderValue;
            const concentrationPercentage = (newSecurityValue / portfolioValue) * 100;
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Concentration limits check passed';
            let recommendedAction;
            for (const limit of concentrationLimits) {
                if (concentrationPercentage > limit.breachThreshold) {
                    status = 'FAIL';
                    severity = 'HIGH';
                    message = `Concentration limit breach: ${concentrationPercentage.toFixed(1)}% of portfolio`;
                    recommendedAction = 'Diversify holdings or obtain concentration limit waiver';
                    break;
                }
                else if (concentrationPercentage > limit.warningThreshold) {
                    status = 'WARNING';
                    severity = 'MEDIUM';
                    message = `Concentration warning: ${concentrationPercentage.toFixed(1)}% of portfolio`;
                    recommendedAction = 'Consider portfolio diversification';
                }
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'CONCENTRATION_LIMIT_CHECK',
                status,
                severity,
                message,
                details: { portfolioValue, securityValue, newSecurityValue, concentrationPercentage },
                actualValue: concentrationPercentage,
                threshold: concentrationLimits[0]?.breachThreshold,
                recommendedAction,
                bypassable: status !== 'FAIL',
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'CONCENTRATION_LIMIT_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkCreditLimits(order) {
        const startTime = Date.now();
        try {
            const creditLimits = this.getEntityLimits(order.counterpartyId, 'CREDIT');
            const currentCreditExposure = await this.getCurrentCreditExposure(order.counterpartyId);
            const orderCreditRisk = await this.calculateOrderCreditRisk(order);
            const newCreditExposure = currentCreditExposure + orderCreditRisk;
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Credit limits check passed';
            let recommendedAction;
            for (const limit of creditLimits) {
                const utilizationPercentage = newCreditExposure / limit.limitValue * 100;
                if (utilizationPercentage > limit.breachThreshold) {
                    status = 'FAIL';
                    severity = 'CRITICAL';
                    message = `Credit limit breach: ${utilizationPercentage.toFixed(1)}% of limit`;
                    recommendedAction = 'Require credit enhancement or reduce exposure';
                    break;
                }
                else if (utilizationPercentage > limit.warningThreshold) {
                    status = 'WARNING';
                    severity = 'MEDIUM';
                    message = `Credit limit warning: ${utilizationPercentage.toFixed(1)}% of limit`;
                    recommendedAction = 'Monitor credit exposure closely';
                }
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'CREDIT_LIMIT_CHECK',
                status,
                severity,
                message,
                details: { currentCreditExposure, orderCreditRisk, newCreditExposure },
                recommendedAction,
                bypassable: status !== 'FAIL',
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'CREDIT_LIMIT_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkSettlementCapacity(order) {
        const startTime = Date.now();
        try {
            const capacity = await this.getSettlementCapacity(order.counterpartyId, order.securityId);
            const orderNotional = order.quantity * order.price;
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Settlement capacity check passed';
            let recommendedAction;
            if (capacity) {
                const newUtilization = ((capacity.currentDailyNotional + orderNotional) / capacity.maxDailyNotional) * 100;
                if (newUtilization > 100) {
                    status = 'FAIL';
                    severity = 'HIGH';
                    message = `Settlement capacity exceeded: ${newUtilization.toFixed(1)}% of daily capacity`;
                    recommendedAction = 'Defer settlement to next business day or split order';
                }
                else if (newUtilization > 85) {
                    status = 'WARNING';
                    severity = 'MEDIUM';
                    message = `High settlement capacity utilization: ${newUtilization.toFixed(1)}%`;
                    recommendedAction = 'Monitor remaining capacity';
                }
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'SETTLEMENT_CAPACITY_CHECK',
                status,
                severity,
                message,
                details: capacity,
                recommendedAction,
                bypassable: status !== 'FAIL',
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'SETTLEMENT_CAPACITY_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkLiquidity(order) {
        const startTime = Date.now();
        try {
            const liquidityInfo = await this.getLiquidityInfo(order.securityId, order.quantity, order.side);
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Liquidity check passed';
            let recommendedAction;
            switch (liquidityInfo.liquidityRisk) {
                case 'CRITICAL':
                    status = 'FAIL';
                    severity = 'HIGH';
                    message = `Critical liquidity risk: ${liquidityInfo.liquidityScore}/100`;
                    recommendedAction = 'Consider reducing order size or using algorithmic execution';
                    break;
                case 'HIGH':
                    status = 'WARNING';
                    severity = 'MEDIUM';
                    message = `High liquidity risk: ${liquidityInfo.liquidityScore}/100`;
                    recommendedAction = 'Monitor market impact during execution';
                    break;
                case 'MEDIUM':
                    status = 'WARNING';
                    severity = 'LOW';
                    message = `Medium liquidity risk: ${liquidityInfo.liquidityScore}/100`;
                    recommendedAction = 'Consider execution timing';
                    break;
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'LIQUIDITY_CHECK',
                status,
                severity,
                message,
                details: liquidityInfo,
                actualValue: liquidityInfo.liquidityScore,
                threshold: 30, // Minimum acceptable liquidity score
                recommendedAction,
                bypassable: status !== 'FAIL',
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'LIQUIDITY_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkRegulatoryCompliance(order) {
        const startTime = Date.now();
        try {
            const regulatoryRules = Array.from(this.complianceRules.values())
                .filter(rule => rule.ruleType === 'REGULATORY' && rule.isActive);
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Regulatory compliance check passed';
            let recommendedAction;
            const violations = [];
            for (const rule of regulatoryRules) {
                const violation = await this.evaluateComplianceRule(order, rule);
                if (violation) {
                    violations.push(violation);
                    switch (rule.violationAction) {
                        case 'BLOCK':
                            status = 'FAIL';
                            severity = 'CRITICAL';
                            message = `Regulatory violation: ${violation}`;
                            recommendedAction = 'Obtain regulatory approval or cancel order';
                            break;
                        case 'REQUIRE_APPROVAL':
                            if (status === 'PASS')
                                status = 'WARNING';
                            severity = 'HIGH';
                            message = `Regulatory review required: ${violation}`;
                            recommendedAction = 'Obtain compliance approval before execution';
                            break;
                        case 'WARN':
                            if (status === 'PASS')
                                status = 'WARNING';
                            if (severity === 'INFO')
                                severity = 'MEDIUM';
                            message = `Regulatory warning: ${violation}`;
                            recommendedAction = 'Review compliance implications';
                            break;
                    }
                }
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'REGULATORY_COMPLIANCE_CHECK',
                status,
                severity,
                message,
                details: { violations, rulesChecked: regulatoryRules.length },
                recommendedAction,
                bypassable: status !== 'FAIL' || severity === 'INFO',
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'REGULATORY_COMPLIANCE_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkInternalPolicies(order) {
        const startTime = Date.now();
        try {
            const internalRules = Array.from(this.complianceRules.values())
                .filter(rule => rule.ruleType === 'INTERNAL' && rule.isActive);
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Internal policy check passed';
            let recommendedAction;
            const violations = [];
            for (const rule of internalRules) {
                const violation = await this.evaluateComplianceRule(order, rule);
                if (violation) {
                    violations.push(violation);
                    switch (rule.violationAction) {
                        case 'BLOCK':
                            status = 'FAIL';
                            severity = 'HIGH';
                            message = `Policy violation: ${violation}`;
                            recommendedAction = 'Obtain management approval or cancel order';
                            break;
                        case 'REQUIRE_APPROVAL':
                            if (status === 'PASS')
                                status = 'WARNING';
                            severity = 'MEDIUM';
                            message = `Management approval required: ${violation}`;
                            recommendedAction = 'Escalate to senior management';
                            break;
                        case 'WARN':
                            if (status === 'PASS')
                                status = 'WARNING';
                            if (severity === 'INFO')
                                severity = 'LOW';
                            message = `Policy warning: ${violation}`;
                            recommendedAction = 'Review policy compliance';
                            break;
                    }
                }
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'INTERNAL_POLICY_CHECK',
                status,
                severity,
                message,
                details: { violations, rulesChecked: internalRules.length },
                recommendedAction,
                bypassable: status !== 'FAIL',
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'INTERNAL_POLICY_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkMarketHours(order) {
        const startTime = Date.now();
        try {
            const marketHours = await this.getMarketHours(order.securityId);
            const currentTime = new Date();
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Market hours check passed';
            let recommendedAction;
            if (!this.isMarketOpen(currentTime, marketHours)) {
                status = 'WARNING';
                severity = 'MEDIUM';
                message = 'Market is currently closed';
                recommendedAction = 'Order will be queued for next market open';
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'MARKET_HOURS_CHECK',
                status,
                severity,
                message,
                details: { marketHours, currentTime },
                recommendedAction,
                bypassable: true,
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'MARKET_HOURS_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkSettlementDate(order) {
        const startTime = Date.now();
        try {
            const businessDays = await this.getBusinessDaysBetween(new Date(), order.settlementDate);
            const standardSettlementDays = await this.getStandardSettlementDays(order.securityId);
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Settlement date check passed';
            let recommendedAction;
            if (businessDays < standardSettlementDays) {
                status = 'WARNING';
                severity = 'MEDIUM';
                message = `Shortened settlement period: T+${businessDays} vs standard T+${standardSettlementDays}`;
                recommendedAction = 'Verify counterparty can settle early';
            }
            else if (businessDays > standardSettlementDays + 5) {
                status = 'WARNING';
                severity = 'LOW';
                message = `Extended settlement period: T+${businessDays}`;
                recommendedAction = 'Consider settlement risk implications';
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'SETTLEMENT_DATE_CHECK',
                status,
                severity,
                message,
                details: { businessDays, standardSettlementDays, settlementDate: order.settlementDate },
                recommendedAction,
                bypassable: true,
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'SETTLEMENT_DATE_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkPriceReasonableness(order) {
        const startTime = Date.now();
        try {
            const marketPrice = await this.getMarketPrice(order.securityId);
            const priceDeviation = Math.abs(order.price - marketPrice) / marketPrice * 100;
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Price reasonableness check passed';
            let recommendedAction;
            if (priceDeviation > 20) {
                status = 'FAIL';
                severity = 'HIGH';
                message = `Price deviation too high: ${priceDeviation.toFixed(1)}% from market`;
                recommendedAction = 'Verify order price or obtain senior approval';
            }
            else if (priceDeviation > 10) {
                status = 'WARNING';
                severity = 'MEDIUM';
                message = `Significant price deviation: ${priceDeviation.toFixed(1)}% from market`;
                recommendedAction = 'Confirm order price accuracy';
            }
            else if (priceDeviation > 5) {
                status = 'WARNING';
                severity = 'LOW';
                message = `Moderate price deviation: ${priceDeviation.toFixed(1)}% from market`;
                recommendedAction = 'Monitor execution carefully';
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'PRICE_REASONABLENESS_CHECK',
                status,
                severity,
                message,
                details: { orderPrice: order.price, marketPrice, priceDeviation },
                actualValue: priceDeviation,
                threshold: 20,
                recommendedAction,
                bypassable: status !== 'FAIL',
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'PRICE_REASONABLENESS_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkCrossTrades(order) {
        const startTime = Date.now();
        try {
            const oppositeOrders = await this.findOppositeOrders(order);
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Cross trade check passed';
            let recommendedAction;
            if (oppositeOrders.length > 0) {
                status = 'WARNING';
                severity = 'MEDIUM';
                message = `Potential cross trades identified: ${oppositeOrders.length} orders`;
                recommendedAction = 'Review for cross trade opportunities';
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'CROSS_TRADE_CHECK',
                status,
                severity,
                message,
                details: { oppositeOrders: oppositeOrders.length },
                recommendedAction,
                bypassable: true,
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'CROSS_TRADE_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkWashTrades(order) {
        const startTime = Date.now();
        try {
            const recentTrades = await this.getRecentTrades(order.portfolioId, order.securityId, 30); // Last 30 days
            const washTradeRisk = this.analyzeWashTradeRisk(order, recentTrades);
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Wash trade check passed';
            let recommendedAction;
            if (washTradeRisk.riskLevel === 'HIGH') {
                status = 'FAIL';
                severity = 'CRITICAL';
                message = `High wash trade risk detected`;
                recommendedAction = 'Review trading pattern with compliance';
            }
            else if (washTradeRisk.riskLevel === 'MEDIUM') {
                status = 'WARNING';
                severity = 'MEDIUM';
                message = `Moderate wash trade risk detected`;
                recommendedAction = 'Document business rationale';
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'WASH_TRADE_CHECK',
                status,
                severity,
                message,
                details: washTradeRisk,
                recommendedAction,
                bypassable: status !== 'FAIL',
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'WASH_TRADE_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkRestrictedSecurities(order) {
        const startTime = Date.now();
        try {
            const restrictionInfo = await this.getSecurityRestrictions(order.securityId, order.portfolioId);
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'Restricted securities check passed';
            let recommendedAction;
            if (restrictionInfo.isRestricted) {
                switch (restrictionInfo.restrictionType) {
                    case 'BLOCKED':
                        status = 'FAIL';
                        severity = 'CRITICAL';
                        message = `Security is blocked: ${restrictionInfo.reason}`;
                        recommendedAction = 'Remove from restricted list or cancel order';
                        break;
                    case 'APPROVAL_REQUIRED':
                        status = 'WARNING';
                        severity = 'HIGH';
                        message = `Security requires approval: ${restrictionInfo.reason}`;
                        recommendedAction = 'Obtain compliance approval before execution';
                        break;
                    case 'WARNING':
                        status = 'WARNING';
                        severity = 'MEDIUM';
                        message = `Security flagged: ${restrictionInfo.reason}`;
                        recommendedAction = 'Review restriction details';
                        break;
                }
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'RESTRICTED_SECURITY_CHECK',
                status,
                severity,
                message,
                details: restrictionInfo,
                recommendedAction,
                bypassable: status !== 'FAIL',
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'RESTRICTED_SECURITY_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    async checkKycAml(order) {
        const startTime = Date.now();
        try {
            const kycStatus = await this.getKycStatus(order.counterpartyId);
            const amlRisk = await this.getAmlRiskLevel(order.counterpartyId);
            let status = 'PASS';
            let severity = 'INFO';
            let message = 'KYC/AML check passed';
            let recommendedAction;
            if (kycStatus.status !== 'APPROVED') {
                status = 'FAIL';
                severity = 'CRITICAL';
                message = `KYC not approved: ${kycStatus.status}`;
                recommendedAction = 'Complete KYC process before trading';
            }
            else if (amlRisk.riskLevel === 'HIGH') {
                status = 'WARNING';
                severity = 'HIGH';
                message = `High AML risk counterparty`;
                recommendedAction = 'Enhanced due diligence required';
            }
            else if (amlRisk.riskLevel === 'MEDIUM') {
                status = 'WARNING';
                severity = 'MEDIUM';
                message = `Medium AML risk counterparty`;
                recommendedAction = 'Monitor transaction patterns';
            }
            return {
                checkId: (0, uuid_1.v4)(),
                orderId: order.id,
                checkType: 'KYC_AML_CHECK',
                status,
                severity,
                message,
                details: { kycStatus, amlRisk },
                recommendedAction,
                bypassable: status !== 'FAIL',
                executedAt: new Date(),
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult(order.id, 'KYC_AML_CHECK', error instanceof Error ? error.message : 'Unknown error', startTime);
        }
    }
    createErrorResult(orderId, checkType, errorMessage, startTime) {
        return {
            checkId: (0, uuid_1.v4)(),
            orderId,
            checkType,
            status: 'FAIL',
            severity: 'HIGH',
            message: `Check execution failed: ${errorMessage}`,
            bypassable: false,
            executedAt: new Date(),
            executionTimeMs: Date.now() - startTime
        };
    }
    // Mock implementations of data access methods (would be replaced with actual service calls)
    getEntityLimits(entityId, limitType) {
        return this.riskLimits.get(`${entityId}_${limitType}`) || [];
    }
    async getCurrentPosition(portfolioId, securityId) {
        // Mock implementation
        return Math.floor(Math.random() * 10000);
    }
    async getCurrentCounterpartyExposure(counterpartyId) {
        // Mock implementation
        return Math.floor(Math.random() * 1000000);
    }
    async getPortfolioValue(portfolioId) {
        // Mock implementation
        return Math.floor(Math.random() * 100000000) + 10000000;
    }
    async getCurrentSecurityValue(portfolioId, securityId) {
        // Mock implementation
        return Math.floor(Math.random() * 5000000);
    }
    async getCurrentCreditExposure(counterpartyId) {
        // Mock implementation
        return Math.floor(Math.random() * 2000000);
    }
    async calculateOrderCreditRisk(order) {
        // Mock implementation - simplified credit risk calculation
        return order.quantity * order.price * 0.1; // 10% of notional
    }
    async getSettlementCapacity(counterpartyId, securityId) {
        // Mock implementation
        return {
            counterpartyId,
            securityType: 'EQUITY',
            currency: 'USD',
            maxDailyVolume: 1000000,
            maxDailyNotional: 50000000,
            currentDailyVolume: 750000,
            currentDailyNotional: 35000000,
            availableCapacity: 15000000,
            utilizationPercentage: 70,
            lastUpdated: new Date()
        };
    }
    async getLiquidityInfo(securityId, quantity, side) {
        // Mock implementation
        const availableLiquidity = Math.floor(Math.random() * 1000000) + 100000;
        const liquidityRatio = Math.min(quantity / availableLiquidity, 1.0);
        let liquidityRisk;
        let liquidityScore;
        if (liquidityRatio > 0.5) {
            liquidityRisk = 'CRITICAL';
            liquidityScore = 20;
        }
        else if (liquidityRatio > 0.3) {
            liquidityRisk = 'HIGH';
            liquidityScore = 40;
        }
        else if (liquidityRatio > 0.1) {
            liquidityRisk = 'MEDIUM';
            liquidityScore = 60;
        }
        else {
            liquidityRisk = 'LOW';
            liquidityScore = 80;
        }
        return {
            securityId,
            requiredQuantity: quantity,
            side,
            availableLiquidity,
            liquidityRatio,
            averageDailyVolume: availableLiquidity * 2,
            marketImpact: liquidityRatio * 100,
            liquidityScore,
            liquidityRisk
        };
    }
    async evaluateComplianceRule(order, rule) {
        // Mock implementation - would parse and evaluate rule logic
        // For now, randomly return violations for demonstration
        if (Math.random() < 0.1) { // 10% chance of violation
            return `Rule violation: ${rule.ruleName}`;
        }
        return null;
    }
    async getMarketHours(securityId) {
        // Mock implementation
        return { open: '09:30', close: '16:00', timezone: 'EST' };
    }
    isMarketOpen(currentTime, marketHours) {
        // Simplified market hours check
        const hour = currentTime.getHours();
        const minute = currentTime.getMinutes();
        const currentMinutes = hour * 60 + minute;
        const [openHour, openMinute] = marketHours.open.split(':').map(Number);
        const [closeHour, closeMinute] = marketHours.close.split(':').map(Number);
        const openMinutes = openHour * 60 + openMinute;
        const closeMinutes = closeHour * 60 + closeMinute;
        return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    }
    async getBusinessDaysBetween(startDate, endDate) {
        // Mock implementation
        const timeDiff = endDate.getTime() - startDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return Math.max(1, daysDiff); // At least 1 business day
    }
    async getStandardSettlementDays(securityId) {
        // Mock implementation - would lookup security type and return standard settlement
        return 2; // T+2 for equities
    }
    async getMarketPrice(securityId) {
        // Mock implementation
        return Math.random() * 1000 + 10;
    }
    async findOppositeOrders(order) {
        // Mock implementation
        return [];
    }
    async getRecentTrades(portfolioId, securityId, days) {
        // Mock implementation
        return [];
    }
    analyzeWashTradeRisk(order, recentTrades) {
        // Mock implementation
        return { riskLevel: 'LOW', details: {} };
    }
    async getSecurityRestrictions(securityId, portfolioId) {
        // Mock implementation
        return { isRestricted: false };
    }
    async getKycStatus(counterpartyId) {
        // Mock implementation
        return { status: 'APPROVED', lastUpdated: new Date() };
    }
    async getAmlRiskLevel(counterpartyId) {
        // Mock implementation
        return { riskLevel: 'LOW', score: 25 };
    }
    // Public management methods
    addRiskLimit(entityId, limit) {
        const riskLimit = {
            ...limit,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const key = `${entityId}_${limit.limitType}`;
        const limits = this.riskLimits.get(key) || [];
        limits.push(riskLimit);
        this.riskLimits.set(key, limits);
        this.emit('riskLimitAdded', riskLimit);
        return riskLimit;
    }
    addComplianceRule(rule) {
        const complianceRule = {
            ...rule,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.complianceRules.set(complianceRule.id, complianceRule);
        this.emit('complianceRuleAdded', complianceRule);
        return complianceRule;
    }
    bypassRiskCheck(suiteId, checkId, bypassReason, bypassedBy) {
        for (const history of this.riskCheckHistory.values()) {
            const suite = history.find(s => s.suiteId === suiteId);
            if (suite) {
                const result = suite.results.find(r => r.checkId === checkId);
                if (result && result.bypassable) {
                    result.bypassReason = bypassReason;
                    result.bypassedBy = bypassedBy;
                    // Recalculate suite status
                    suite.overallStatus = this.determineOverallStatus(suite.results);
                    suite.canProceed = this.canTradeProceed(suite.results);
                    this.emit('riskCheckBypassed', { suiteId, checkId, bypassReason, bypassedBy });
                    return true;
                }
            }
        }
        return false;
    }
    // Getter methods
    getRiskCheckHistory(orderId) {
        return this.riskCheckHistory.get(orderId) || [];
    }
    getLatestRiskCheck(orderId) {
        const history = this.riskCheckHistory.get(orderId) || [];
        return history[history.length - 1];
    }
    getAllActiveAlerts() {
        const alerts = [];
        this.riskCheckHistory.forEach(history => {
            const latestSuite = history[history.length - 1];
            if (latestSuite) {
                const alertResults = latestSuite.results.filter(r => (r.status === 'FAIL' || r.status === 'WARNING') &&
                    (r.severity === 'HIGH' || r.severity === 'CRITICAL'));
                alerts.push(...alertResults);
            }
        });
        return alerts.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
    }
    generateRiskSummary(timeFrame = 'DAILY') {
        const cutoff = new Date();
        switch (timeFrame) {
            case 'DAILY':
                cutoff.setDate(cutoff.getDate() - 1);
                break;
            case 'WEEKLY':
                cutoff.setDate(cutoff.getDate() - 7);
                break;
            case 'MONTHLY':
                cutoff.setDate(cutoff.getDate() - 30);
                break;
        }
        const allResults = [];
        this.riskCheckHistory.forEach(history => {
            history.forEach(suite => {
                if (suite.executedAt >= cutoff) {
                    allResults.push(...suite.results);
                }
            });
        });
        const totalChecks = allResults.length;
        const passed = allResults.filter(r => r.status === 'PASS').length;
        const failed = allResults.filter(r => r.status === 'FAIL').length;
        const warnings = allResults.filter(r => r.status === 'WARNING').length;
        // Count failures by check type
        const failureCounts = new Map();
        allResults.filter(r => r.status === 'FAIL').forEach(r => {
            failureCounts.set(r.checkType, (failureCounts.get(r.checkType) || 0) + 1);
        });
        const mostCommonFailures = Array.from(failureCounts.entries())
            .map(([checkType, count]) => ({ checkType, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        const totalExecutionTime = allResults.reduce((sum, r) => sum + r.executionTimeMs, 0);
        const averageExecutionTime = totalChecks > 0 ? totalExecutionTime / totalChecks : 0;
        return {
            totalChecksExecuted: totalChecks,
            passRate: totalChecks > 0 ? (passed / totalChecks) * 100 : 0,
            failRate: totalChecks > 0 ? (failed / totalChecks) * 100 : 0,
            warningRate: totalChecks > 0 ? (warnings / totalChecks) * 100 : 0,
            mostCommonFailures,
            averageExecutionTime
        };
    }
}
exports.PreSettlementRiskChecksService = PreSettlementRiskChecksService;

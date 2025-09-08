"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorRecoveryService = exports.RecoveryStatus = exports.ValidationType = exports.RecoveryStepType = void 0;
const events_1 = require("events");
const winston_1 = require("winston");
const ErrorTrackingService_1 = require("./ErrorTrackingService");
var RecoveryStepType;
(function (RecoveryStepType) {
    RecoveryStepType["RESTART_SERVICE"] = "restart_service";
    RecoveryStepType["CLEAR_CACHE"] = "clear_cache";
    RecoveryStepType["RESET_CONNECTION"] = "reset_connection";
    RecoveryStepType["SCALE_RESOURCES"] = "scale_resources";
    RecoveryStepType["ROLLBACK_DEPLOYMENT"] = "rollback_deployment";
    RecoveryStepType["EXECUTE_SCRIPT"] = "execute_script";
    RecoveryStepType["SEND_NOTIFICATION"] = "send_notification";
    RecoveryStepType["UPDATE_CONFIG"] = "update_config";
    RecoveryStepType["MANUAL_INTERVENTION"] = "manual_intervention";
    RecoveryStepType["HEALTH_CHECK"] = "health_check";
})(RecoveryStepType || (exports.RecoveryStepType = RecoveryStepType = {}));
var ValidationType;
(function (ValidationType) {
    ValidationType["HEALTH_CHECK"] = "health_check";
    ValidationType["PERFORMANCE_TEST"] = "performance_test";
    ValidationType["CONNECTIVITY_TEST"] = "connectivity_test";
    ValidationType["DATA_INTEGRITY"] = "data_integrity";
    ValidationType["USER_ACCEPTANCE"] = "user_acceptance";
})(ValidationType || (exports.ValidationType = ValidationType = {}));
var RecoveryStatus;
(function (RecoveryStatus) {
    RecoveryStatus["PENDING"] = "pending";
    RecoveryStatus["IN_PROGRESS"] = "in_progress";
    RecoveryStatus["COMPLETED"] = "completed";
    RecoveryStatus["FAILED"] = "failed";
    RecoveryStatus["ROLLED_BACK"] = "rolled_back";
    RecoveryStatus["CANCELLED"] = "cancelled";
})(RecoveryStatus || (exports.RecoveryStatus = RecoveryStatus = {}));
class ErrorRecoveryService extends events_1.EventEmitter {
    logger;
    prisma;
    recoveryStrategies = new Map();
    activeRecoveries = new Map();
    autoRecoveryConfig;
    executionQueue = [];
    isProcessing = false;
    constructor(prisma, autoRecoveryConfig) {
        super();
        this.prisma = prisma;
        this.autoRecoveryConfig = autoRecoveryConfig;
        this.logger = this.createLogger();
        this.initializeDefaultStrategies();
        this.startRecoveryProcessor();
    }
    createLogger() {
        return (0, winston_1.createLogger)({
            level: 'info',
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.json()),
            transports: [
                new winston_1.transports.File({
                    filename: 'logs/error-recovery.log',
                    maxsize: 100 * 1024 * 1024, // 100MB
                    maxFiles: 10
                }),
                new winston_1.transports.Console({
                    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple())
                })
            ]
        });
    }
    initializeDefaultStrategies() {
        const defaultStrategies = [
            {
                id: 'database_connection_recovery',
                name: 'Database Connection Recovery',
                description: 'Recover from database connection failures',
                category: ErrorTrackingService_1.ErrorCategory.DATABASE,
                applicableConditions: [
                    {
                        field: 'message',
                        operator: 'contains',
                        value: 'connection',
                        weight: 0.8
                    },
                    {
                        field: 'category',
                        operator: 'equals',
                        value: ErrorTrackingService_1.ErrorCategory.DATABASE,
                        weight: 0.9
                    }
                ],
                steps: [
                    {
                        id: 'check_db_health',
                        name: 'Check Database Health',
                        description: 'Verify database server status and connectivity',
                        type: RecoveryStepType.HEALTH_CHECK,
                        parameters: {
                            endpoint: '/health/database',
                            expectedStatus: 200,
                            timeout: 30
                        },
                        timeout: 30,
                        retryable: true,
                        maxRetries: 3,
                        rollbackRequired: false,
                        validationChecks: [ValidationType.CONNECTIVITY_TEST]
                    },
                    {
                        id: 'reset_connection_pool',
                        name: 'Reset Connection Pool',
                        description: 'Clear and reinitialize database connection pool',
                        type: RecoveryStepType.RESET_CONNECTION,
                        parameters: {
                            service: 'database-service',
                            poolName: 'primary-pool'
                        },
                        timeout: 60,
                        retryable: true,
                        maxRetries: 2,
                        rollbackRequired: false,
                        validationChecks: [ValidationType.CONNECTIVITY_TEST]
                    },
                    {
                        id: 'restart_db_service',
                        name: 'Restart Database Service',
                        description: 'Restart the database service if connection issues persist',
                        type: RecoveryStepType.RESTART_SERVICE,
                        parameters: {
                            service: 'database-service',
                            gracefulShutdown: true,
                            waitForHealthy: true
                        },
                        timeout: 300,
                        retryable: false,
                        maxRetries: 1,
                        rollbackRequired: false,
                        validationChecks: [ValidationType.HEALTH_CHECK, ValidationType.CONNECTIVITY_TEST]
                    }
                ],
                automaticExecution: true,
                requiredPermissions: ['database:restart', 'service:manage'],
                estimatedTime: 10,
                riskLevel: 'medium',
                successRate: 0.85,
                prerequisites: ['Database monitoring enabled', 'Service restart permissions']
            },
            {
                id: 'memory_exhaustion_recovery',
                name: 'Memory Exhaustion Recovery',
                description: 'Recover from out of memory errors',
                category: ErrorTrackingService_1.ErrorCategory.SYSTEM,
                applicableConditions: [
                    {
                        field: 'message',
                        operator: 'matches',
                        value: /out.*of.*memory|memory.*exhausted|heap.*overflow/i,
                        weight: 0.9
                    }
                ],
                steps: [
                    {
                        id: 'trigger_garbage_collection',
                        name: 'Force Garbage Collection',
                        description: 'Force garbage collection to free up memory',
                        type: RecoveryStepType.EXECUTE_SCRIPT,
                        parameters: {
                            script: 'gc-force.sh',
                            service: '{{error.context.service}}'
                        },
                        timeout: 30,
                        retryable: true,
                        maxRetries: 2,
                        rollbackRequired: false,
                        validationChecks: [ValidationType.PERFORMANCE_TEST]
                    },
                    {
                        id: 'scale_memory_resources',
                        name: 'Scale Memory Resources',
                        description: 'Increase memory allocation for the affected service',
                        type: RecoveryStepType.SCALE_RESOURCES,
                        parameters: {
                            resource: 'memory',
                            action: 'increase',
                            percentage: 50,
                            service: '{{error.context.service}}'
                        },
                        timeout: 120,
                        retryable: true,
                        maxRetries: 1,
                        rollbackRequired: true,
                        validationChecks: [ValidationType.HEALTH_CHECK, ValidationType.PERFORMANCE_TEST]
                    },
                    {
                        id: 'restart_service_memory',
                        name: 'Restart Service',
                        description: 'Restart the service with increased memory allocation',
                        type: RecoveryStepType.RESTART_SERVICE,
                        parameters: {
                            service: '{{error.context.service}}',
                            gracefulShutdown: true,
                            waitForHealthy: true
                        },
                        timeout: 180,
                        retryable: false,
                        maxRetries: 1,
                        rollbackRequired: false,
                        validationChecks: [ValidationType.HEALTH_CHECK, ValidationType.PERFORMANCE_TEST]
                    }
                ],
                automaticExecution: false, // Requires approval due to resource scaling
                requiredPermissions: ['resource:scale', 'service:restart'],
                estimatedTime: 15,
                riskLevel: 'high',
                successRate: 0.75,
                prerequisites: ['Auto-scaling enabled', 'Resource scaling permissions']
            },
            {
                id: 'trading_system_recovery',
                name: 'Trading System Recovery',
                description: 'Recover from trading system failures',
                category: ErrorTrackingService_1.ErrorCategory.TRADING,
                applicableConditions: [
                    {
                        field: 'category',
                        operator: 'equals',
                        value: ErrorTrackingService_1.ErrorCategory.TRADING,
                        weight: 0.9
                    },
                    {
                        field: 'severity',
                        operator: 'in',
                        value: [ErrorTrackingService_1.ErrorSeverity.CRITICAL, ErrorTrackingService_1.ErrorSeverity.HIGH],
                        weight: 0.7
                    }
                ],
                steps: [
                    {
                        id: 'check_market_connectivity',
                        name: 'Check Market Connectivity',
                        description: 'Verify connectivity to market data providers',
                        type: RecoveryStepType.HEALTH_CHECK,
                        parameters: {
                            endpoints: [
                                '/health/market-data',
                                '/health/order-gateway'
                            ]
                        },
                        timeout: 30,
                        retryable: true,
                        maxRetries: 3,
                        rollbackRequired: false,
                        validationChecks: [ValidationType.CONNECTIVITY_TEST]
                    },
                    {
                        id: 'reset_trading_session',
                        name: 'Reset Trading Session',
                        description: 'Reset trading session and reconnect to exchanges',
                        type: RecoveryStepType.RESET_CONNECTION,
                        parameters: {
                            service: 'trading-service',
                            sessionType: 'trading'
                        },
                        timeout: 90,
                        retryable: true,
                        maxRetries: 2,
                        rollbackRequired: false,
                        validationChecks: [ValidationType.CONNECTIVITY_TEST]
                    },
                    {
                        id: 'notify_trading_team',
                        name: 'Notify Trading Team',
                        description: 'Send immediate notification to trading team',
                        type: RecoveryStepType.SEND_NOTIFICATION,
                        parameters: {
                            channels: ['trading-alerts'],
                            priority: 'critical',
                            message: 'Trading system recovery initiated for error: {{error.id}}'
                        },
                        timeout: 10,
                        retryable: true,
                        maxRetries: 2,
                        rollbackRequired: false,
                        validationChecks: []
                    }
                ],
                automaticExecution: true,
                requiredPermissions: ['trading:manage', 'notification:send'],
                estimatedTime: 5,
                riskLevel: 'high',
                successRate: 0.8,
                prerequisites: ['Trading team notification channels configured']
            },
            {
                id: 'authentication_service_recovery',
                name: 'Authentication Service Recovery',
                description: 'Recover from authentication service failures',
                category: ErrorTrackingService_1.ErrorCategory.AUTHENTICATION,
                applicableConditions: [
                    {
                        field: 'category',
                        operator: 'equals',
                        value: ErrorTrackingService_1.ErrorCategory.AUTHENTICATION,
                        weight: 0.8
                    },
                    {
                        field: 'count',
                        operator: 'gt',
                        value: 10,
                        weight: 0.6
                    }
                ],
                steps: [
                    {
                        id: 'clear_auth_cache',
                        name: 'Clear Authentication Cache',
                        description: 'Clear authentication cache to resolve token issues',
                        type: RecoveryStepType.CLEAR_CACHE,
                        parameters: {
                            cacheType: 'authentication',
                            service: 'auth-service'
                        },
                        timeout: 30,
                        retryable: true,
                        maxRetries: 2,
                        rollbackRequired: false,
                        validationChecks: [ValidationType.HEALTH_CHECK]
                    },
                    {
                        id: 'restart_auth_service',
                        name: 'Restart Authentication Service',
                        description: 'Restart authentication service if cache clearing fails',
                        type: RecoveryStepType.RESTART_SERVICE,
                        parameters: {
                            service: 'auth-service',
                            gracefulShutdown: true,
                            waitForHealthy: true
                        },
                        timeout: 120,
                        retryable: false,
                        maxRetries: 1,
                        rollbackRequired: false,
                        validationChecks: [ValidationType.HEALTH_CHECK, ValidationType.USER_ACCEPTANCE]
                    }
                ],
                automaticExecution: true,
                requiredPermissions: ['auth:manage', 'service:restart'],
                estimatedTime: 8,
                riskLevel: 'medium',
                successRate: 0.9,
                prerequisites: ['Authentication service monitoring enabled']
            }
        ];
        defaultStrategies.forEach(strategy => {
            this.recoveryStrategies.set(strategy.id, strategy);
        });
        this.logger.info('Default recovery strategies initialized', {
            strategiesCount: defaultStrategies.length
        });
    }
    async suggestRecoveryStrategies(error, rootCauseAnalysis) {
        const suggestions = [];
        try {
            for (const strategy of this.recoveryStrategies.values()) {
                const confidence = this.calculateStrategyConfidence(error, strategy, rootCauseAnalysis);
                if (confidence > 0.3) { // Minimum confidence threshold
                    const suggestion = {
                        strategyId: strategy.id,
                        confidence,
                        reasoning: this.generateReasoning(error, strategy, confidence),
                        estimatedImpact: this.estimateImpact(strategy, error),
                        automationRecommended: this.shouldAutomate(strategy, error, confidence),
                        prerequisites: strategy.prerequisites,
                        alternatives: this.findAlternativeStrategies(strategy, error)
                    };
                    suggestions.push(suggestion);
                }
            }
            // Sort by confidence and return top 5
            suggestions.sort((a, b) => b.confidence - a.confidence);
            this.emit('recoverySuggestionsGenerated', {
                errorId: error.id,
                suggestionsCount: suggestions.length,
                topSuggestion: suggestions[0]
            });
            return suggestions.slice(0, 5);
        }
        catch (error) {
            this.logger.error('Failed to suggest recovery strategies', {
                errorId: error.id,
                error: error.message
            });
            return [];
        }
    }
    calculateStrategyConfidence(error, strategy, rootCauseAnalysis) {
        let confidence = 0;
        let totalWeight = 0;
        // Check strategy conditions
        for (const condition of strategy.applicableConditions) {
            totalWeight += condition.weight;
            if (this.conditionMatches(condition, error)) {
                confidence += condition.weight;
            }
        }
        const baseConfidence = totalWeight > 0 ? confidence / totalWeight : 0;
        // Adjust confidence based on historical success rate
        const adjustedConfidence = baseConfidence * strategy.successRate;
        // Boost confidence if root cause analysis supports this strategy
        let rootCauseBoost = 0;
        if (rootCauseAnalysis) {
            rootCauseBoost = this.calculateRootCauseAlignment(strategy, rootCauseAnalysis);
        }
        return Math.min(adjustedConfidence + rootCauseBoost, 1);
    }
    conditionMatches(condition, error) {
        const value = this.getFieldValue(error, condition.field);
        switch (condition.operator) {
            case 'equals':
                return value === condition.value;
            case 'contains':
                return typeof value === 'string' &&
                    value.toLowerCase().includes(condition.value.toLowerCase());
            case 'matches':
                return typeof value === 'string' &&
                    new RegExp(condition.value, 'i').test(value);
            case 'in':
                return Array.isArray(condition.value) && condition.value.includes(value);
            case 'gt':
                return typeof value === 'number' && value > condition.value;
            case 'lt':
                return typeof value === 'number' && value < condition.value;
            default:
                return false;
        }
    }
    getFieldValue(error, field) {
        if (field.includes('.')) {
            const parts = field.split('.');
            let value = error;
            for (const part of parts) {
                if (value && typeof value === 'object') {
                    value = value[part];
                }
                else {
                    return null;
                }
            }
            return value;
        }
        else {
            return error[field];
        }
    }
    calculateRootCauseAlignment(strategy, rootCauseAnalysis) {
        // Check if strategy aligns with identified root causes
        const strategyCauses = this.getStrategyCauses(strategy);
        const identifiedCauses = rootCauseAnalysis.possibleCauses.map(c => c.cause.toLowerCase());
        let alignment = 0;
        for (const strategyCause of strategyCauses) {
            if (identifiedCauses.some(cause => cause.includes(strategyCause.toLowerCase()))) {
                alignment = Math.max(alignment, 0.2); // Boost confidence by 20%
            }
        }
        return alignment;
    }
    getStrategyCauses(strategy) {
        // Extract potential causes that this strategy addresses
        const causes = [];
        switch (strategy.category) {
            case ErrorTrackingService_1.ErrorCategory.DATABASE:
                causes.push('database connection', 'database performance', 'connection pool');
                break;
            case ErrorTrackingService_1.ErrorCategory.SYSTEM:
                causes.push('memory exhaustion', 'resource constraints', 'system overload');
                break;
            case ErrorTrackingService_1.ErrorCategory.TRADING:
                causes.push('market connectivity', 'trading session', 'order gateway');
                break;
            case ErrorTrackingService_1.ErrorCategory.AUTHENTICATION:
                causes.push('token issues', 'session management', 'auth service');
                break;
        }
        return causes;
    }
    generateReasoning(error, strategy, confidence) {
        const reasons = [];
        if (strategy.category === error.category) {
            reasons.push(`Matches error category (${error.category})`);
        }
        if (confidence > 0.8) {
            reasons.push('High confidence match based on error patterns');
        }
        else if (confidence > 0.6) {
            reasons.push('Good match based on error characteristics');
        }
        else {
            reasons.push('Partial match - may be applicable');
        }
        if (strategy.successRate > 0.8) {
            reasons.push(`Historical success rate: ${Math.round(strategy.successRate * 100)}%`);
        }
        if (strategy.riskLevel === 'low') {
            reasons.push('Low risk recovery strategy');
        }
        return reasons.join('. ');
    }
    estimateImpact(strategy, error) {
        if (strategy.riskLevel === 'high' ||
            strategy.steps.some(step => step.type === RecoveryStepType.RESTART_SERVICE)) {
            return 'high';
        }
        if (strategy.steps.some(step => step.rollbackRequired) ||
            error.severity === ErrorTrackingService_1.ErrorSeverity.CRITICAL) {
            return 'medium';
        }
        return 'low';
    }
    shouldAutomate(strategy, error, confidence) {
        if (!this.autoRecoveryConfig.enabled) {
            return false;
        }
        if (!strategy.automaticExecution) {
            return false;
        }
        if (strategy.riskLevel === 'high' && this.autoRecoveryConfig.requiredApprovals.highRisk) {
            return false;
        }
        if (error.context.environment === 'production' &&
            this.autoRecoveryConfig.requiredApprovals.productionEnvironment) {
            return false;
        }
        if (this.autoRecoveryConfig.requiredApprovals.criticalServices.includes(error.context.service)) {
            return false;
        }
        return confidence > 0.7;
    }
    findAlternativeStrategies(strategy, error) {
        const alternatives = [];
        for (const [id, altStrategy] of this.recoveryStrategies.entries()) {
            if (id !== strategy.id &&
                altStrategy.category === strategy.category &&
                altStrategy.riskLevel !== strategy.riskLevel) {
                alternatives.push(altStrategy.name);
            }
        }
        return alternatives.slice(0, 3); // Limit to 3 alternatives
    }
    async executeRecoveryStrategy(errorId, strategyId, initiatedBy, autoExecution = false) {
        const strategy = this.recoveryStrategies.get(strategyId);
        if (!strategy) {
            throw new Error(`Recovery strategy not found: ${strategyId}`);
        }
        const error = await this.getError(errorId);
        if (!error) {
            throw new Error(`Error not found: ${errorId}`);
        }
        // Check if recovery is already in progress for this error
        const existingRecovery = Array.from(this.activeRecoveries.values())
            .find(recovery => recovery.errorId === errorId &&
            recovery.status === RecoveryStatus.IN_PROGRESS);
        if (existingRecovery) {
            throw new Error(`Recovery already in progress for error: ${errorId}`);
        }
        // Check concurrent recovery limits
        if (this.activeRecoveries.size >= this.autoRecoveryConfig.maxConcurrentRecoveries) {
            throw new Error('Maximum concurrent recoveries limit reached');
        }
        const execution = {
            id: this.generateExecutionId(),
            errorId,
            strategyId,
            initiatedBy,
            startTime: new Date(),
            status: RecoveryStatus.PENDING,
            currentStep: 0,
            steps: strategy.steps.map(step => ({
                stepId: step.id,
                startTime: new Date(),
                status: RecoveryStatus.PENDING,
                attempts: 0,
                rollbackPerformed: false
            })),
            results: {
                success: false,
                stepsCompleted: 0,
                totalSteps: strategy.steps.length,
                timeTaken: 0,
                errorResolved: false,
                sideEffects: [],
                recommendations: [],
                followUpActions: []
            },
            logs: [],
            rollbackExecuted: false
        };
        this.activeRecoveries.set(execution.id, execution);
        await this.storeRecoveryExecution(execution);
        // Add to execution queue
        this.executionQueue.push(execution.id);
        this.emit('recoveryInitiated', {
            executionId: execution.id,
            errorId,
            strategyId,
            autoExecution
        });
        // Start processing if not already running
        if (!this.isProcessing) {
            this.processRecoveryQueue();
        }
        return execution;
    }
    async processRecoveryQueue() {
        if (this.isProcessing || this.executionQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        try {
            while (this.executionQueue.length > 0) {
                const executionId = this.executionQueue.shift();
                const execution = this.activeRecoveries.get(executionId);
                if (execution) {
                    await this.executeRecovery(execution);
                }
            }
        }
        catch (error) {
            this.logger.error('Error processing recovery queue', {
                error: error.message
            });
        }
        finally {
            this.isProcessing = false;
        }
    }
    async executeRecovery(execution) {
        const strategy = this.recoveryStrategies.get(execution.strategyId);
        const error = await this.getError(execution.errorId);
        if (!error) {
            execution.status = RecoveryStatus.FAILED;
            this.addLog(execution, 'error', 'Associated error not found');
            return;
        }
        execution.status = RecoveryStatus.IN_PROGRESS;
        this.addLog(execution, 'info', `Starting recovery execution for strategy: ${strategy.name}`);
        try {
            for (let i = 0; i < strategy.steps.length; i++) {
                execution.currentStep = i;
                const step = strategy.steps[i];
                const stepExecution = execution.steps[i];
                this.addLog(execution, 'info', `Executing step ${i + 1}/${strategy.steps.length}: ${step.name}`);
                const stepResult = await this.executeRecoveryStep(step, stepExecution, error, execution);
                if (stepResult.success) {
                    execution.results.stepsCompleted++;
                    this.addLog(execution, 'info', `Step completed successfully: ${step.name}`);
                }
                else {
                    this.addLog(execution, 'error', `Step failed: ${step.name} - ${stepResult.error}`);
                    if (!step.retryable) {
                        // Step failed and is not retryable, abort recovery
                        execution.status = RecoveryStatus.FAILED;
                        break;
                    }
                }
                // Update execution in database
                await this.updateRecoveryExecution(execution);
            }
            // Determine final status
            if (execution.status !== RecoveryStatus.FAILED) {
                if (execution.results.stepsCompleted === strategy.steps.length) {
                    execution.status = RecoveryStatus.COMPLETED;
                    execution.results.success = true;
                    // Check if error is resolved
                    execution.results.errorResolved = await this.checkErrorResolution(error);
                    this.addLog(execution, 'info', 'Recovery execution completed successfully');
                }
                else {
                    execution.status = RecoveryStatus.FAILED;
                    this.addLog(execution, 'error', 'Recovery execution failed - not all steps completed');
                }
            }
        }
        catch (error) {
            execution.status = RecoveryStatus.FAILED;
            this.addLog(execution, 'error', `Recovery execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            execution.endTime = new Date();
            execution.results.timeTaken = execution.endTime.getTime() - execution.startTime.getTime();
            // Generate recommendations and follow-up actions
            execution.results.recommendations = this.generateRecommendations(execution, strategy);
            execution.results.followUpActions = this.generateFollowUpActions(execution, strategy);
            await this.updateRecoveryExecution(execution);
            this.activeRecoveries.delete(execution.id);
            this.emit('recoveryCompleted', {
                executionId: execution.id,
                success: execution.results.success,
                errorResolved: execution.results.errorResolved
            });
        }
    }
    async executeRecoveryStep(step, stepExecution, error, execution) {
        stepExecution.startTime = new Date();
        stepExecution.status = RecoveryStatus.IN_PROGRESS;
        for (let attempt = 1; attempt <= step.maxRetries; attempt++) {
            stepExecution.attempts = attempt;
            try {
                const result = await this.executeStepAction(step, error, execution);
                if (result.success) {
                    stepExecution.status = RecoveryStatus.COMPLETED;
                    stepExecution.output = result.output;
                    stepExecution.endTime = new Date();
                    return { success: true };
                }
                else {
                    this.addLog(execution, 'warn', `Step attempt ${attempt}/${step.maxRetries} failed: ${result.error}`, step.id);
                    if (attempt < step.maxRetries && step.retryable) {
                        // Wait before retry
                        await this.sleep(2000 * attempt); // Exponential backoff
                        continue;
                    }
                    else {
                        stepExecution.status = RecoveryStatus.FAILED;
                        stepExecution.error = result.error;
                        stepExecution.endTime = new Date();
                        return { success: false, error: result.error };
                    }
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.addLog(execution, 'error', `Step attempt ${attempt}/${step.maxRetries} threw exception: ${errorMessage}`, step.id);
                if (attempt === step.maxRetries) {
                    stepExecution.status = RecoveryStatus.FAILED;
                    stepExecution.error = errorMessage;
                    stepExecution.endTime = new Date();
                    return { success: false, error: errorMessage };
                }
            }
        }
        return { success: false, error: 'All retry attempts exhausted' };
    }
    async executeStepAction(step, error, execution) {
        // Replace template variables in parameters
        const parameters = this.replaceTemplateVariables(step.parameters, error);
        switch (step.type) {
            case RecoveryStepType.HEALTH_CHECK:
                return await this.executeHealthCheck(parameters);
            case RecoveryStepType.RESTART_SERVICE:
                return await this.executeServiceRestart(parameters);
            case RecoveryStepType.CLEAR_CACHE:
                return await this.executeCacheClear(parameters);
            case RecoveryStepType.RESET_CONNECTION:
                return await this.executeConnectionReset(parameters);
            case RecoveryStepType.SCALE_RESOURCES:
                return await this.executeResourceScaling(parameters);
            case RecoveryStepType.EXECUTE_SCRIPT:
                return await this.executeScript(parameters);
            case RecoveryStepType.SEND_NOTIFICATION:
                return await this.executeSendNotification(parameters, error);
            case RecoveryStepType.UPDATE_CONFIG:
                return await this.executeConfigUpdate(parameters);
            case RecoveryStepType.MANUAL_INTERVENTION:
                return await this.executeManualIntervention(parameters, execution);
            default:
                return { success: false, error: `Unsupported step type: ${step.type}` };
        }
    }
    replaceTemplateVariables(parameters, error) {
        const result = { ...parameters };
        for (const [key, value] of Object.entries(result)) {
            if (typeof value === 'string' && value.includes('{{')) {
                result[key] = value.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
                    try {
                        const parts = expression.trim().split('.');
                        let obj = { error };
                        for (const part of parts) {
                            if (obj && typeof obj === 'object' && part in obj) {
                                obj = obj[part];
                            }
                            else {
                                return match; // Return original if path not found
                            }
                        }
                        return String(obj);
                    }
                    catch {
                        return match; // Return original on error
                    }
                });
            }
        }
        return result;
    }
    // Step execution methods (simplified implementations)
    async executeHealthCheck(parameters) {
        // Mock implementation - in real system, this would make actual health check calls
        this.logger.info('Executing health check', { parameters });
        // Simulate health check
        await this.sleep(1000);
        return {
            success: true,
            output: 'Health check passed'
        };
    }
    async executeServiceRestart(parameters) {
        this.logger.info('Executing service restart', { parameters });
        // Mock implementation - in real system, this would restart actual services
        await this.sleep(5000);
        return {
            success: true,
            output: `Service ${parameters.service} restarted successfully`
        };
    }
    async executeCacheClear(parameters) {
        this.logger.info('Executing cache clear', { parameters });
        await this.sleep(1000);
        return {
            success: true,
            output: `Cache ${parameters.cacheType} cleared for service ${parameters.service}`
        };
    }
    async executeConnectionReset(parameters) {
        this.logger.info('Executing connection reset', { parameters });
        await this.sleep(2000);
        return {
            success: true,
            output: `Connection reset completed for ${parameters.service}`
        };
    }
    async executeResourceScaling(parameters) {
        this.logger.info('Executing resource scaling', { parameters });
        await this.sleep(3000);
        return {
            success: true,
            output: `Resource ${parameters.resource} scaled ${parameters.action} by ${parameters.percentage}% for ${parameters.service}`
        };
    }
    async executeScript(parameters) {
        this.logger.info('Executing script', { parameters });
        await this.sleep(2000);
        return {
            success: true,
            output: `Script ${parameters.script} executed successfully`
        };
    }
    async executeSendNotification(parameters, error) {
        this.logger.info('Executing send notification', { parameters });
        // Replace template variables in message
        const message = parameters.message.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
            if (expression === 'error.id')
                return error.id;
            if (expression === 'error.message')
                return error.message;
            return match;
        });
        this.emit('recoveryNotification', {
            channels: parameters.channels,
            priority: parameters.priority,
            message
        });
        return {
            success: true,
            output: `Notification sent to channels: ${parameters.channels.join(', ')}`
        };
    }
    async executeConfigUpdate(parameters) {
        this.logger.info('Executing config update', { parameters });
        await this.sleep(1000);
        return {
            success: true,
            output: 'Configuration updated successfully'
        };
    }
    async executeManualIntervention(parameters, execution) {
        this.logger.info('Manual intervention required', { parameters });
        this.emit('manualInterventionRequired', {
            executionId: execution.id,
            parameters
        });
        return {
            success: true,
            output: 'Manual intervention request sent'
        };
    }
    async checkErrorResolution(error) {
        // Check if the error has stopped occurring
        const recentErrors = await this.prisma.error.findMany({
            where: {
                fingerprint: error.fingerprint,
                lastSeen: {
                    gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
                }
            }
        });
        return recentErrors.length === 0;
    }
    generateRecommendations(execution, strategy) {
        const recommendations = [];
        if (execution.results.success) {
            recommendations.push('Monitor system for 30 minutes to ensure stability');
            if (strategy.riskLevel === 'high') {
                recommendations.push('Review system performance metrics after recovery');
            }
            if (execution.results.stepsCompleted < strategy.steps.length) {
                recommendations.push('Investigate why some recovery steps were skipped');
            }
        }
        else {
            recommendations.push('Escalate to manual intervention');
            recommendations.push('Review recovery strategy effectiveness');
            if (execution.results.stepsCompleted > 0) {
                recommendations.push('Consider partial rollback of completed steps');
            }
        }
        return recommendations;
    }
    generateFollowUpActions(execution, strategy) {
        const actions = [];
        if (execution.results.success) {
            actions.push('Update monitoring thresholds if needed');
            actions.push('Document successful recovery for future reference');
        }
        else {
            actions.push('Create incident report');
            actions.push('Review and improve recovery strategy');
            actions.push('Consider additional monitoring for this error pattern');
        }
        return actions;
    }
    async getError(errorId) {
        try {
            const error = await this.prisma.error.findUnique({
                where: { id: errorId }
            });
            return error;
        }
        catch (error) {
            this.logger.error('Failed to get error', {
                errorId,
                error: error.message
            });
            return null;
        }
    }
    async storeRecoveryExecution(execution) {
        try {
            await this.prisma.recoveryExecution.create({
                data: {
                    id: execution.id,
                    errorId: execution.errorId,
                    strategy: execution.strategyId, // Changed from strategyId to strategy
                    initiatedBy: execution.initiatedBy,
                    startTime: execution.startTime,
                    endTime: execution.endTime,
                    status: execution.status,
                    currentStep: execution.currentStep,
                    steps: execution.steps,
                    results: execution.results,
                    logs: execution.logs,
                    rollbackExecuted: execution.rollbackExecuted
                }
            });
        }
        catch (error) {
            this.logger.error('Failed to store recovery execution', {
                executionId: execution.id,
                error: error.message
            });
        }
    }
    async updateRecoveryExecution(execution) {
        try {
            await this.prisma.recoveryExecution.update({
                where: { id: execution.id },
                data: {
                    // Only update fields that exist in Prisma schema
                    status: execution.status,
                    result: execution.results,
                    // steps, logs, and rollbackExecuted don't exist in Prisma schema
                }
            });
        }
        catch (error) {
            this.logger.error('Failed to update recovery execution', {
                executionId: execution.id,
                error: error.message
            });
        }
    }
    addLog(execution, level, message, stepId) {
        const log = {
            timestamp: new Date(),
            level,
            message,
            stepId
        };
        execution.logs.push(log);
        this.logger[level](message, {
            executionId: execution.id,
            stepId
        });
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    generateExecutionId() {
        return `recovery_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    startRecoveryProcessor() {
        // Process recovery queue every 30 seconds
        setInterval(() => {
            if (!this.isProcessing && this.executionQueue.length > 0) {
                this.processRecoveryQueue();
            }
        }, 30 * 1000);
        // Clean up completed recoveries every hour
        setInterval(() => {
            this.cleanupCompletedRecoveries();
        }, 60 * 60 * 1000);
    }
    cleanupCompletedRecoveries() {
        const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
        for (const [id, execution] of this.activeRecoveries.entries()) {
            if (execution.endTime && execution.endTime.getTime() < cutoff) {
                this.activeRecoveries.delete(id);
            }
        }
    }
    addRecoveryStrategy(strategy) {
        this.recoveryStrategies.set(strategy.id, strategy);
        this.logger.info('Recovery strategy added', { strategyId: strategy.id });
    }
    getRecoveryStrategies() {
        return Array.from(this.recoveryStrategies.values());
    }
    getActiveRecoveries() {
        return Array.from(this.activeRecoveries.values());
    }
    async getRecoveryHistory(errorId) {
        try {
            const where = errorId ? { errorId } : {};
            const executions = await this.prisma.recoveryExecution.findMany({
                where,
                orderBy: { startedAt: 'desc' }, // Changed from startTime to startedAt
                take: 100
            });
            return executions;
        }
        catch (error) {
            this.logger.error('Failed to get recovery history', {
                errorId,
                error: error.message
            });
            return [];
        }
    }
    async cancelRecovery(executionId, cancelledBy) {
        const execution = this.activeRecoveries.get(executionId);
        if (!execution || execution.status !== RecoveryStatus.IN_PROGRESS) {
            return false;
        }
        execution.status = RecoveryStatus.CANCELLED;
        execution.endTime = new Date();
        this.addLog(execution, 'info', `Recovery cancelled by ${cancelledBy}`);
        await this.updateRecoveryExecution(execution);
        this.activeRecoveries.delete(executionId);
        this.emit('recoveryCancelled', { executionId, cancelledBy });
        return true;
    }
    async shutdown() {
        this.logger.info('Shutting down error recovery service');
        // Cancel all active recoveries
        for (const [id, execution] of this.activeRecoveries.entries()) {
            if (execution.status === RecoveryStatus.IN_PROGRESS) {
                await this.cancelRecovery(id, 'system-shutdown');
            }
        }
        this.removeAllListeners();
    }
}
exports.ErrorRecoveryService = ErrorRecoveryService;

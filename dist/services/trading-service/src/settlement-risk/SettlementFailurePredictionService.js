"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementFailurePredictionService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class SettlementFailurePredictionService extends events_1.EventEmitter {
    predictionModels;
    predictionHistory;
    failurePatterns;
    performanceMetrics;
    activeModel;
    // Feature weights for prediction model
    FEATURE_WEIGHTS = new Map([
        ['counterparty_success_rate', 0.25],
        ['counterparty_avg_delay', 0.20],
        ['security_type_success_rate', 0.15],
        ['market_volatility', 0.12],
        ['liquidity_index', 0.10],
        ['credit_spread', 0.08],
        ['notional_amount', 0.05],
        ['time_to_settlement', 0.03],
        ['system_load', 0.02]
    ]);
    // Risk factor thresholds
    RISK_THRESHOLDS = {
        COUNTERPARTY_SUCCESS_RATE: 0.95,
        AVG_DELAY_DAYS: 1.0,
        VOLATILITY_INDEX: 0.30,
        LIQUIDITY_INDEX: 0.70,
        CREDIT_SPREAD_INDEX: 0.25,
        SYSTEM_LOAD: 0.80
    };
    constructor() {
        super();
        this.predictionModels = new Map();
        this.predictionHistory = new Map();
        this.failurePatterns = new Map();
        this.performanceMetrics = new Map();
        this.activeModel = null;
        this.initializeDefaultModel();
        this.initializeFailurePatterns();
    }
    initializeDefaultModel() {
        const defaultModel = {
            modelId: (0, uuid_1.v4)(),
            modelName: 'Settlement Failure Predictor v1.0',
            version: '1.0.0',
            algorithm: 'ENSEMBLE',
            accuracy: 0.92,
            precision: 0.88,
            recall: 0.85,
            f1Score: 0.86,
            lastTrainingDate: new Date(),
            trainingDataSize: 50000,
            featureImportance: new Map(this.FEATURE_WEIGHTS),
            isActive: true
        };
        this.predictionModels.set(defaultModel.modelId, defaultModel);
        this.activeModel = defaultModel;
    }
    initializeFailurePatterns() {
        const patterns = [
            {
                patternId: (0, uuid_1.v4)(),
                patternName: 'Weekend Settlement Risk',
                description: 'Higher failure rates for settlements on or near weekends',
                frequency: 0.15,
                avgImpact: 0.3,
                conditions: [
                    { field: 'settlement_day_of_week', operator: 'EQUALS', value: 'FRIDAY', weight: 0.6 },
                    { field: 'time_to_settlement', operator: 'LESS_THAN', value: 24, weight: 0.4 }
                ],
                detectionRules: ['settlement_date.dayOfWeek IN [5, 6, 0]', 'hours_to_settlement < 24'],
                preventionMeasures: ['Early settlement processing', 'Weekend operations coverage'],
                identifiedCount: 1250,
                lastSeen: new Date()
            },
            {
                patternId: (0, uuid_1.v4)(),
                patternName: 'High Volatility Settlement Stress',
                description: 'Increased failure rates during high market volatility periods',
                frequency: 0.08,
                avgImpact: 0.45,
                conditions: [
                    { field: 'volatility_index', operator: 'GREATER_THAN', value: 0.4, weight: 0.7 },
                    { field: 'market_stress_level', operator: 'EQUALS', value: 'HIGH', weight: 0.3 }
                ],
                detectionRules: ['volatility_index > 0.4', 'market_stress_level IN [HIGH, EXTREME]'],
                preventionMeasures: ['Enhanced monitoring', 'Backup settlement channels', 'Risk reduction'],
                identifiedCount: 890,
                lastSeen: new Date()
            },
            {
                patternId: (0, uuid_1.v4)(),
                patternName: 'New Counterparty Risk',
                description: 'Higher failure rates with counterparties with limited settlement history',
                frequency: 0.22,
                avgImpact: 0.35,
                conditions: [
                    { field: 'counterparty_history_months', operator: 'LESS_THAN', value: 6, weight: 0.8 },
                    { field: 'counterparty_success_rate', operator: 'LESS_THAN', value: 0.95, weight: 0.2 }
                ],
                detectionRules: ['counterparty_history_months < 6', 'settlement_count < 50'],
                preventionMeasures: ['Enhanced due diligence', 'Manual review', 'Phased volume increase'],
                identifiedCount: 2100,
                lastSeen: new Date()
            },
            {
                patternId: (0, uuid_1.v4)(),
                patternName: 'Large Trade Settlement Risk',
                description: 'Higher complexity and failure rates for large notional trades',
                frequency: 0.05,
                avgImpact: 0.60,
                conditions: [
                    { field: 'notional_amount', operator: 'GREATER_THAN', value: 50000000, weight: 0.6 },
                    { field: 'security_type', operator: 'EQUALS', value: 'STRUCTURED_PRODUCT', weight: 0.4 }
                ],
                detectionRules: ['notional_amount > 50M', 'trade_complexity_score > 7'],
                preventionMeasures: ['Pre-settlement verification', 'Senior approval', 'Dedicated processing'],
                identifiedCount: 340,
                lastSeen: new Date()
            }
        ];
        patterns.forEach(pattern => {
            this.failurePatterns.set(pattern.patternId, pattern);
        });
    }
    async predictSettlementFailure(input) {
        if (!this.activeModel) {
            throw new Error('No active prediction model available');
        }
        try {
            // Extract features from input
            const features = this.extractFeatures(input);
            // Calculate base failure probability using ensemble approach
            const baseProbability = this.calculateBaseProbability(features);
            // Apply pattern-based adjustments
            const patternAdjustment = this.applyPatternAdjustments(input, features);
            // Calculate final probability with bounds checking
            const failureProbability = Math.max(0, Math.min(1, baseProbability + patternAdjustment));
            // Determine risk level
            const riskLevel = this.determineRiskLevel(failureProbability);
            // Calculate expected delay
            const expectedDelayDays = this.calculateExpectedDelay(failureProbability, input);
            // Calculate confidence level
            const confidenceLevel = this.calculateConfidenceLevel(features, input);
            // Identify key risk factors
            const keyRiskFactors = this.identifyKeyRiskFactors(features, input);
            // Generate mitigation suggestions
            const mitigationSuggestions = this.generateMitigationSuggestions(failureProbability, keyRiskFactors, input);
            // Create early warning indicators
            const earlyWarningIndicators = this.createEarlyWarningIndicators(input, features);
            const prediction = {
                predictionId: (0, uuid_1.v4)(),
                instructionId: input.instructionId,
                failureProbability,
                riskLevel,
                expectedDelayDays,
                confidenceLevel,
                keyRiskFactors,
                mitigationSuggestions,
                earlyWarningIndicators,
                modelVersion: this.activeModel.version,
                predictionTimestamp: new Date(),
                validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000) // Valid for 4 hours
            };
            // Store prediction history
            const history = this.predictionHistory.get(input.instructionId) || [];
            history.push(prediction);
            this.predictionHistory.set(input.instructionId, history);
            this.emit('predictionGenerated', prediction);
            // Emit alerts for high-risk predictions
            if (riskLevel === 'HIGH' || riskLevel === 'VERY_HIGH') {
                this.emit('highRiskPrediction', prediction);
            }
            return prediction;
        }
        catch (error) {
            this.emit('predictionError', { instructionId: input.instructionId, error: error.message });
            throw error;
        }
    }
    extractFeatures(input) {
        const features = new Map();
        // Counterparty features
        features.set('counterparty_success_rate', input.historicalContext.counterpartySuccessRate);
        features.set('counterparty_avg_delay', input.historicalContext.counterpartyAvgDelayDays);
        features.set('recent_failures', input.historicalContext.recentFailures);
        // Security features
        features.set('security_type_success_rate', input.historicalContext.securityTypeSuccessRate);
        features.set('notional_amount_normalized', Math.log10(input.notionalAmount + 1) / 10); // Log normalize
        // Market features
        features.set('market_volatility', input.marketConditions.volatilityIndex);
        features.set('liquidity_index', input.marketConditions.liquidityIndex);
        features.set('credit_spread', input.marketConditions.creditSpreadIndex);
        features.set('system_load', input.marketConditions.systemLoad);
        // Temporal features
        const timeToSettlement = (input.settlementDate.getTime() - input.tradeDate.getTime()) / (24 * 60 * 60 * 1000);
        features.set('time_to_settlement', timeToSettlement);
        features.set('settlement_day_of_week', input.settlementDate.getDay());
        features.set('seasonal_factor', input.historicalContext.seasonalFactors);
        // Priority and method features
        const priorityMap = { 'LOW': 0.25, 'MEDIUM': 0.5, 'HIGH': 0.75, 'CRITICAL': 1.0 };
        features.set('priority_score', priorityMap[input.priority]);
        const methodMap = { 'DVP': 0.8, 'FOP': 0.6, 'RVP': 0.7, 'CASH': 0.9 };
        features.set('settlement_method_score', methodMap[input.settlementMethod] || 0.5);
        // Market stress level
        const stressMap = { 'NORMAL': 0.2, 'ELEVATED': 0.4, 'HIGH': 0.7, 'EXTREME': 1.0 };
        features.set('market_stress', stressMap[input.marketConditions.marketStressLevel]);
        return features;
    }
    calculateBaseProbability(features) {
        // Ensemble approach combining multiple algorithms
        const logisticScore = this.logisticRegressionPredict(features);
        const randomForestScore = this.randomForestPredict(features);
        const neuralNetworkScore = this.neuralNetworkPredict(features);
        // Weighted ensemble
        return 0.4 * logisticScore + 0.35 * randomForestScore + 0.25 * neuralNetworkScore;
    }
    logisticRegressionPredict(features) {
        // Simplified logistic regression implementation
        let linearCombination = -2.5; // Intercept
        for (const [feature, value] of features) {
            const weight = this.FEATURE_WEIGHTS.get(feature) || 0;
            linearCombination += weight * value;
        }
        // Sigmoid function
        return 1 / (1 + Math.exp(-linearCombination));
    }
    randomForestPredict(features) {
        // Simplified random forest implementation using decision rules
        let score = 0.1; // Base probability
        // Tree 1: Counterparty reliability
        if (features.get('counterparty_success_rate') < 0.95) {
            score += 0.3;
            if (features.get('counterparty_avg_delay') > 1.0) {
                score += 0.2;
            }
        }
        // Tree 2: Market conditions
        if (features.get('market_volatility') > 0.3) {
            score += 0.25;
            if (features.get('liquidity_index') < 0.7) {
                score += 0.15;
            }
        }
        // Tree 3: Operational factors
        if (features.get('system_load') > 0.8) {
            score += 0.2;
        }
        if (features.get('time_to_settlement') < 1) {
            score += 0.15;
        }
        return Math.min(1.0, score);
    }
    neuralNetworkPredict(features) {
        // Simplified neural network with one hidden layer
        const weights1 = [0.3, -0.4, 0.5, -0.2, 0.6, -0.3, 0.4, 0.2, -0.1];
        const weights2 = [0.8, -0.6, 0.7];
        // Hidden layer activation
        const hiddenLayer = [];
        let i = 0;
        for (const [_, value] of features) {
            if (i < weights1.length) {
                hiddenLayer.push(Math.tanh(weights1[i] * value));
                i++;
            }
        }
        // Output layer
        let output = 0;
        for (let j = 0; j < Math.min(hiddenLayer.length, weights2.length); j++) {
            output += weights2[j] * hiddenLayer[j];
        }
        // Sigmoid activation
        return 1 / (1 + Math.exp(-output));
    }
    applyPatternAdjustments(input, features) {
        let adjustment = 0;
        for (const pattern of this.failurePatterns.values()) {
            const patternMatch = this.evaluatePattern(pattern, input, features);
            if (patternMatch > 0.5) {
                adjustment += pattern.frequency * pattern.avgImpact * patternMatch;
            }
        }
        return adjustment;
    }
    evaluatePattern(pattern, input, features) {
        let matchScore = 0;
        let totalWeight = 0;
        for (const condition of pattern.conditions) {
            let conditionMet = false;
            let value;
            // Extract value based on field
            switch (condition.field) {
                case 'settlement_day_of_week':
                    value = input.settlementDate.getDay();
                    break;
                case 'volatility_index':
                    value = input.marketConditions.volatilityIndex;
                    break;
                case 'market_stress_level':
                    value = input.marketConditions.marketStressLevel;
                    break;
                case 'notional_amount':
                    value = input.notionalAmount;
                    break;
                case 'counterparty_success_rate':
                    value = input.historicalContext.counterpartySuccessRate;
                    break;
                default:
                    value = features.get(condition.field) || 0;
            }
            // Evaluate condition
            switch (condition.operator) {
                case 'EQUALS':
                    conditionMet = value === condition.value;
                    break;
                case 'GREATER_THAN':
                    conditionMet = value > condition.value;
                    break;
                case 'LESS_THAN':
                    conditionMet = value < condition.value;
                    break;
                case 'BETWEEN':
                    conditionMet = value >= condition.value[0] && value <= condition.value[1];
                    break;
                case 'CONTAINS':
                    conditionMet = Array.isArray(condition.value) && condition.value.includes(value);
                    break;
            }
            if (conditionMet) {
                matchScore += condition.weight;
            }
            totalWeight += condition.weight;
        }
        return totalWeight > 0 ? matchScore / totalWeight : 0;
    }
    determineRiskLevel(probability) {
        if (probability >= 0.8)
            return 'VERY_HIGH';
        if (probability >= 0.6)
            return 'HIGH';
        if (probability >= 0.4)
            return 'MEDIUM';
        if (probability >= 0.2)
            return 'LOW';
        return 'VERY_LOW';
    }
    calculateExpectedDelay(probability, input) {
        // Base delay increases with failure probability
        let expectedDelay = probability * 3; // Up to 3 days base delay
        // Adjust based on historical counterparty performance
        expectedDelay += input.historicalContext.counterpartyAvgDelayDays * 0.3;
        // Market conditions adjustment
        if (input.marketConditions.marketStressLevel === 'HIGH' ||
            input.marketConditions.marketStressLevel === 'EXTREME') {
            expectedDelay *= 1.5;
        }
        // Weekend/holiday adjustments
        if (input.marketConditions.holidayAdjustments) {
            expectedDelay += 1;
        }
        return Math.round(expectedDelay * 10) / 10; // Round to 1 decimal place
    }
    calculateConfidenceLevel(features, input) {
        let confidence = 0.8; // Base confidence
        // Reduce confidence for new counterparties (less historical data)
        if (input.historicalContext.counterpartySuccessRate === 1.0) {
            confidence *= 0.7; // Likely insufficient data
        }
        // Reduce confidence during extreme market conditions
        if (input.marketConditions.marketStressLevel === 'EXTREME') {
            confidence *= 0.8;
        }
        // Increase confidence for well-established patterns
        const dataAge = Date.now() - this.activeModel.lastTrainingDate.getTime();
        const daysSinceTraining = dataAge / (24 * 60 * 60 * 1000);
        if (daysSinceTraining > 30) {
            confidence *= 0.95; // Slightly reduce for older models
        }
        return Math.max(0.5, Math.min(0.99, confidence));
    }
    identifyKeyRiskFactors(features, input) {
        const riskFactors = [];
        // Counterparty risk factors
        if (input.historicalContext.counterpartySuccessRate < this.RISK_THRESHOLDS.COUNTERPARTY_SUCCESS_RATE) {
            riskFactors.push({
                factor: 'Low Counterparty Success Rate',
                impact: 1 - input.historicalContext.counterpartySuccessRate,
                weight: 0.25,
                description: `Counterparty has ${(input.historicalContext.counterpartySuccessRate * 100).toFixed(1)}% success rate`,
                category: 'COUNTERPARTY'
            });
        }
        if (input.historicalContext.counterpartyAvgDelayDays > this.RISK_THRESHOLDS.AVG_DELAY_DAYS) {
            riskFactors.push({
                factor: 'High Average Delay',
                impact: Math.min(1, input.historicalContext.counterpartyAvgDelayDays / 5),
                weight: 0.20,
                description: `Counterparty averages ${input.historicalContext.counterpartyAvgDelayDays.toFixed(1)} day delays`,
                category: 'COUNTERPARTY'
            });
        }
        // Market risk factors
        if (input.marketConditions.volatilityIndex > this.RISK_THRESHOLDS.VOLATILITY_INDEX) {
            riskFactors.push({
                factor: 'High Market Volatility',
                impact: input.marketConditions.volatilityIndex,
                weight: 0.12,
                description: `Market volatility at ${(input.marketConditions.volatilityIndex * 100).toFixed(1)}%`,
                category: 'MARKET'
            });
        }
        if (input.marketConditions.liquidityIndex < this.RISK_THRESHOLDS.LIQUIDITY_INDEX) {
            riskFactors.push({
                factor: 'Low Market Liquidity',
                impact: 1 - input.marketConditions.liquidityIndex,
                weight: 0.10,
                description: `Market liquidity at ${(input.marketConditions.liquidityIndex * 100).toFixed(1)}%`,
                category: 'MARKET'
            });
        }
        // Operational risk factors
        if (input.marketConditions.systemLoad > this.RISK_THRESHOLDS.SYSTEM_LOAD) {
            riskFactors.push({
                factor: 'High System Load',
                impact: input.marketConditions.systemLoad,
                weight: 0.02,
                description: `System load at ${(input.marketConditions.systemLoad * 100).toFixed(1)}%`,
                category: 'OPERATIONAL'
            });
        }
        // Security-specific factors
        if (input.historicalContext.securityTypeSuccessRate < 0.98) {
            riskFactors.push({
                factor: 'Security Type Risk',
                impact: 1 - input.historicalContext.securityTypeSuccessRate,
                weight: 0.15,
                description: `${input.securityType} has ${(input.historicalContext.securityTypeSuccessRate * 100).toFixed(1)}% success rate`,
                category: 'SECURITY'
            });
        }
        // Sort by impact descending
        return riskFactors.sort((a, b) => b.impact - a.impact).slice(0, 5);
    }
    generateMitigationSuggestions(probability, riskFactors, input) {
        const suggestions = [];
        // High probability general suggestions
        if (probability > 0.7) {
            suggestions.push({
                id: (0, uuid_1.v4)(),
                suggestion: 'Initiate proactive communication with counterparty',
                expectedImpact: 0.3,
                implementationCost: 'LOW',
                timeToImplement: 1,
                priority: 'HIGH',
                category: 'PREVENTION'
            });
            suggestions.push({
                id: (0, uuid_1.v4)(),
                suggestion: 'Enable real-time monitoring and alerts',
                expectedImpact: 0.4,
                implementationCost: 'LOW',
                timeToImplement: 0.5,
                priority: 'HIGH',
                category: 'MONITORING'
            });
        }
        // Risk factor specific suggestions
        for (const factor of riskFactors) {
            switch (factor.category) {
                case 'COUNTERPARTY':
                    if (factor.factor.includes('Success Rate')) {
                        suggestions.push({
                            id: (0, uuid_1.v4)(),
                            suggestion: 'Require additional settlement confirmation',
                            expectedImpact: 0.25,
                            implementationCost: 'LOW',
                            timeToImplement: 0.5,
                            priority: 'MEDIUM',
                            category: 'PREVENTION'
                        });
                    }
                    break;
                case 'MARKET':
                    if (factor.factor.includes('Volatility')) {
                        suggestions.push({
                            id: (0, uuid_1.v4)(),
                            suggestion: 'Consider settlement guarantee or insurance',
                            expectedImpact: 0.6,
                            implementationCost: 'HIGH',
                            timeToImplement: 24,
                            priority: 'MEDIUM',
                            category: 'PREVENTION'
                        });
                    }
                    break;
                case 'OPERATIONAL':
                    suggestions.push({
                        id: (0, uuid_1.v4)(),
                        suggestion: 'Allocate dedicated operations resources',
                        expectedImpact: 0.3,
                        implementationCost: 'MEDIUM',
                        timeToImplement: 2,
                        priority: 'MEDIUM',
                        category: 'RESPONSE'
                    });
                    break;
            }
        }
        // Large trade specific suggestions
        if (input.notionalAmount > 50000000) {
            suggestions.push({
                id: (0, uuid_1.v4)(),
                suggestion: 'Break into smaller settlement batches',
                expectedImpact: 0.4,
                implementationCost: 'MEDIUM',
                timeToImplement: 4,
                priority: 'MEDIUM',
                category: 'PREVENTION'
            });
        }
        // Sort by expected impact and priority
        return suggestions
            .sort((a, b) => {
            const priorityWeight = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
            const aPriority = priorityWeight[a.priority];
            const bPriority = priorityWeight[b.priority];
            if (aPriority !== bPriority)
                return bPriority - aPriority;
            return b.expectedImpact - a.expectedImpact;
        })
            .slice(0, 5);
    }
    createEarlyWarningIndicators(input, features) {
        return [
            {
                indicator: 'Counterparty Response Time',
                currentValue: input.historicalContext.counterpartyAvgDelayDays * 24, // Convert to hours
                threshold: 24,
                status: input.historicalContext.counterpartyAvgDelayDays > 1 ? 'WARNING' : 'NORMAL',
                trend: 'STABLE',
                leadTime: 48
            },
            {
                indicator: 'Market Liquidity Level',
                currentValue: input.marketConditions.liquidityIndex * 100,
                threshold: 70,
                status: input.marketConditions.liquidityIndex < 0.7 ? 'WARNING' : 'NORMAL',
                trend: 'STABLE',
                leadTime: 24
            },
            {
                indicator: 'System Capacity Utilization',
                currentValue: input.marketConditions.systemLoad * 100,
                threshold: 80,
                status: input.marketConditions.systemLoad > 0.8 ? 'CRITICAL' :
                    input.marketConditions.systemLoad > 0.6 ? 'WARNING' : 'NORMAL',
                trend: 'STABLE',
                leadTime: 12
            },
            {
                indicator: 'Settlement Window Remaining',
                currentValue: (input.settlementDate.getTime() - Date.now()) / (60 * 60 * 1000), // Hours
                threshold: 24,
                status: (input.settlementDate.getTime() - Date.now()) < (24 * 60 * 60 * 1000) ? 'WARNING' : 'NORMAL',
                trend: 'DETERIORATING',
                leadTime: 6
            }
        ];
    }
    async updatePredictionAccuracy(instructionId, actualOutcome, actualDelayDays) {
        const predictions = this.predictionHistory.get(instructionId) || [];
        if (predictions.length === 0)
            return;
        const latestPrediction = predictions[predictions.length - 1];
        const predictedFailure = latestPrediction.failureProbability > 0.5;
        const actualFailure = actualOutcome === 'FAILURE';
        // Update model performance metrics
        await this.updateModelPerformance(latestPrediction, actualFailure, actualDelayDays);
        // Emit feedback event for model retraining
        this.emit('predictionFeedback', {
            predictionId: latestPrediction.predictionId,
            instructionId,
            predictedFailure,
            actualFailure,
            predictedDelay: latestPrediction.expectedDelayDays,
            actualDelay: actualDelayDays || 0,
            modelVersion: latestPrediction.modelVersion
        });
    }
    async updateModelPerformance(prediction, actualFailure, actualDelay) {
        const modelVersion = prediction.modelVersion;
        let metrics = this.performanceMetrics.get(modelVersion);
        if (!metrics) {
            metrics = {
                modelVersion,
                evaluationPeriod: new Date().toISOString().substring(0, 7), // YYYY-MM
                totalPredictions: 0,
                correctPredictions: 0,
                falsePositives: 0,
                falseNegatives: 0,
                accuracy: 0,
                precision: 0,
                recall: 0,
                f1Score: 0,
                auc: 0,
                calibrationScore: 0
            };
        }
        metrics.totalPredictions++;
        const predictedFailure = prediction.failureProbability > 0.5;
        const correct = predictedFailure === actualFailure;
        if (correct) {
            metrics.correctPredictions++;
        }
        else if (predictedFailure && !actualFailure) {
            metrics.falsePositives++;
        }
        else if (!predictedFailure && actualFailure) {
            metrics.falseNegatives++;
        }
        // Recalculate metrics
        metrics.accuracy = metrics.correctPredictions / metrics.totalPredictions;
        const truePositives = metrics.correctPredictions - (metrics.totalPredictions - metrics.falsePositives - metrics.falseNegatives);
        metrics.precision = truePositives > 0 ? truePositives / (truePositives + metrics.falsePositives) : 0;
        metrics.recall = truePositives > 0 ? truePositives / (truePositives + metrics.falseNegatives) : 0;
        metrics.f1Score = metrics.precision + metrics.recall > 0 ?
            2 * (metrics.precision * metrics.recall) / (metrics.precision + metrics.recall) : 0;
        this.performanceMetrics.set(modelVersion, metrics);
    }
    detectFailurePatterns(settlementHistory) {
        const detectedPatterns = [];
        // This would implement pattern detection algorithms
        // For now, return existing patterns that have been identified
        return Array.from(this.failurePatterns.values());
    }
    getBatchPredictions(inputs) {
        return Promise.all(inputs.map(input => this.predictSettlementFailure(input)));
    }
    // Getter methods
    getPredictionHistory(instructionId) {
        return this.predictionHistory.get(instructionId) || [];
    }
    getLatestPrediction(instructionId) {
        const history = this.predictionHistory.get(instructionId) || [];
        return history[history.length - 1];
    }
    getHighRiskPredictions(threshold = 0.7) {
        const highRiskPredictions = [];
        this.predictionHistory.forEach(predictions => {
            const latest = predictions[predictions.length - 1];
            if (latest && latest.failureProbability >= threshold) {
                highRiskPredictions.push(latest);
            }
        });
        return highRiskPredictions.sort((a, b) => b.failureProbability - a.failureProbability);
    }
    getModelPerformance(modelVersion) {
        const version = modelVersion || this.activeModel?.version;
        return version ? this.performanceMetrics.get(version) : undefined;
    }
    getFailurePatterns() {
        return Array.from(this.failurePatterns.values());
    }
    addFailurePattern(pattern) {
        const newPattern = {
            ...pattern,
            patternId: (0, uuid_1.v4)(),
            identifiedCount: 0,
            lastSeen: new Date()
        };
        this.failurePatterns.set(newPattern.patternId, newPattern);
        this.emit('failurePatternAdded', newPattern);
        return newPattern;
    }
    generatePredictionSummary(timeFrame = 'DAILY') {
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
        const allPredictions = [];
        this.predictionHistory.forEach(predictions => {
            const recent = predictions.filter(p => p.predictionTimestamp >= cutoff);
            allPredictions.push(...recent);
        });
        const highRiskCount = allPredictions.filter(p => p.failureProbability > 0.7).length;
        const averageFailureProbability = allPredictions.length > 0 ?
            allPredictions.reduce((sum, p) => sum + p.failureProbability, 0) / allPredictions.length : 0;
        // Count risk factors
        const riskFactorCounts = new Map();
        allPredictions.forEach(prediction => {
            prediction.keyRiskFactors.forEach(factor => {
                riskFactorCounts.set(factor.factor, (riskFactorCounts.get(factor.factor) || 0) + 1);
            });
        });
        const mostCommonRiskFactors = Array.from(riskFactorCounts.entries())
            .map(([factor, count]) => ({ factor, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        const modelPerformance = this.getModelPerformance();
        const modelAccuracy = modelPerformance?.accuracy || 0;
        return {
            totalPredictions: allPredictions.length,
            highRiskCount,
            averageFailureProbability,
            mostCommonRiskFactors,
            modelAccuracy
        };
    }
}
exports.SettlementFailurePredictionService = SettlementFailurePredictionService;

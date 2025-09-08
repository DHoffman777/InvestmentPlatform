"use strict";
// Risk Management Data Models
// Phase 4.3 - Comprehensive risk management system for enterprise investment platforms
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityCategory = exports.AlertSeverity = exports.RiskLimitType = exports.TimeHorizon = exports.ConfidenceLevel = exports.RiskMeasurementMethod = exports.RiskType = void 0;
// Base Risk Types and Enums
var RiskType;
(function (RiskType) {
    RiskType["MARKET_RISK"] = "MARKET_RISK";
    RiskType["CREDIT_RISK"] = "CREDIT_RISK";
    RiskType["LIQUIDITY_RISK"] = "LIQUIDITY_RISK";
    RiskType["OPERATIONAL_RISK"] = "OPERATIONAL_RISK";
    RiskType["CONCENTRATION_RISK"] = "CONCENTRATION_RISK";
    RiskType["COUNTERPARTY_RISK"] = "COUNTERPARTY_RISK";
    RiskType["CURRENCY_RISK"] = "CURRENCY_RISK";
    RiskType["INTEREST_RATE_RISK"] = "INTEREST_RATE_RISK";
    RiskType["MODEL_RISK"] = "MODEL_RISK";
    RiskType["REGULATORY_RISK"] = "REGULATORY_RISK";
})(RiskType || (exports.RiskType = RiskType = {}));
var RiskMeasurementMethod;
(function (RiskMeasurementMethod) {
    RiskMeasurementMethod["VALUE_AT_RISK"] = "VALUE_AT_RISK";
    RiskMeasurementMethod["CONDITIONAL_VAR"] = "CONDITIONAL_VAR";
    RiskMeasurementMethod["EXPECTED_SHORTFALL"] = "EXPECTED_SHORTFALL";
    RiskMeasurementMethod["MONTE_CARLO"] = "MONTE_CARLO";
    RiskMeasurementMethod["HISTORICAL_SIMULATION"] = "HISTORICAL_SIMULATION";
    RiskMeasurementMethod["PARAMETRIC"] = "PARAMETRIC";
    RiskMeasurementMethod["STRESS_TEST"] = "STRESS_TEST";
    RiskMeasurementMethod["SCENARIO_ANALYSIS"] = "SCENARIO_ANALYSIS";
})(RiskMeasurementMethod || (exports.RiskMeasurementMethod = RiskMeasurementMethod = {}));
var ConfidenceLevel;
(function (ConfidenceLevel) {
    ConfidenceLevel[ConfidenceLevel["NINETY_FIVE"] = 95] = "NINETY_FIVE";
    ConfidenceLevel[ConfidenceLevel["NINETY_NINE"] = 99] = "NINETY_NINE";
    ConfidenceLevel[ConfidenceLevel["NINETY_NINE_NINE"] = 99.9] = "NINETY_NINE_NINE";
})(ConfidenceLevel || (exports.ConfidenceLevel = ConfidenceLevel = {}));
var TimeHorizon;
(function (TimeHorizon) {
    TimeHorizon["ONE_DAY"] = "1D";
    TimeHorizon["ONE_WEEK"] = "1W";
    TimeHorizon["TWO_WEEKS"] = "2W";
    TimeHorizon["ONE_MONTH"] = "1M";
    TimeHorizon["THREE_MONTHS"] = "3M";
    TimeHorizon["SIX_MONTHS"] = "6M";
    TimeHorizon["ONE_YEAR"] = "1Y";
})(TimeHorizon || (exports.TimeHorizon = TimeHorizon = {}));
var RiskLimitType;
(function (RiskLimitType) {
    RiskLimitType["ABSOLUTE_LIMIT"] = "ABSOLUTE_LIMIT";
    RiskLimitType["PERCENTAGE_LIMIT"] = "PERCENTAGE_LIMIT";
    RiskLimitType["VAR_LIMIT"] = "VAR_LIMIT";
    RiskLimitType["NOTIONAL_LIMIT"] = "NOTIONAL_LIMIT";
    RiskLimitType["CONCENTRATION_LIMIT"] = "CONCENTRATION_LIMIT";
    RiskLimitType["LEVERAGE_LIMIT"] = "LEVERAGE_LIMIT";
})(RiskLimitType || (exports.RiskLimitType = RiskLimitType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "LOW";
    AlertSeverity["MEDIUM"] = "MEDIUM";
    AlertSeverity["HIGH"] = "HIGH";
    AlertSeverity["CRITICAL"] = "CRITICAL";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var LiquidityCategory;
(function (LiquidityCategory) {
    LiquidityCategory["IMMEDIATE"] = "IMMEDIATE";
    LiquidityCategory["HIGH"] = "HIGH";
    LiquidityCategory["MEDIUM"] = "MEDIUM";
    LiquidityCategory["LOW"] = "LOW";
    LiquidityCategory["ILLIQUID"] = "ILLIQUID"; // > 3 months
})(LiquidityCategory || (exports.LiquidityCategory = LiquidityCategory = {}));

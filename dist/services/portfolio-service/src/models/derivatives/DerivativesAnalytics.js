"use strict";
// Derivatives Analytics Data Models
// Phase 3.5 - Comprehensive derivatives support with options and futures
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyType = exports.VolatilityModel = exports.MarginType = exports.OptionStatus = exports.ExerciseType = exports.OptionStyle = exports.DerivativeType = void 0;
var DerivativeType;
(function (DerivativeType) {
    DerivativeType["CALL_OPTION"] = "CALL_OPTION";
    DerivativeType["PUT_OPTION"] = "PUT_OPTION";
    DerivativeType["FUTURE"] = "FUTURE";
    DerivativeType["SWAP"] = "SWAP";
    DerivativeType["FORWARD"] = "FORWARD";
    DerivativeType["WARRANT"] = "WARRANT";
    DerivativeType["CONVERTIBLE_BOND"] = "CONVERTIBLE_BOND";
})(DerivativeType || (exports.DerivativeType = DerivativeType = {}));
var OptionStyle;
(function (OptionStyle) {
    OptionStyle["AMERICAN"] = "AMERICAN";
    OptionStyle["EUROPEAN"] = "EUROPEAN";
    OptionStyle["BERMUDAN"] = "BERMUDAN";
    OptionStyle["ASIAN"] = "ASIAN";
    OptionStyle["BARRIER"] = "BARRIER";
    OptionStyle["EXOTIC"] = "EXOTIC";
})(OptionStyle || (exports.OptionStyle = OptionStyle = {}));
var ExerciseType;
(function (ExerciseType) {
    ExerciseType["PHYSICAL_DELIVERY"] = "PHYSICAL_DELIVERY";
    ExerciseType["CASH_SETTLEMENT"] = "CASH_SETTLEMENT";
    ExerciseType["CHOICE_OF_SETTLEMENT"] = "CHOICE_OF_SETTLEMENT";
})(ExerciseType || (exports.ExerciseType = ExerciseType = {}));
var OptionStatus;
(function (OptionStatus) {
    OptionStatus["ACTIVE"] = "ACTIVE";
    OptionStatus["EXPIRED"] = "EXPIRED";
    OptionStatus["EXERCISED"] = "EXERCISED";
    OptionStatus["ASSIGNED"] = "ASSIGNED";
    OptionStatus["CLOSED"] = "CLOSED";
    OptionStatus["CANCELLED"] = "CANCELLED";
})(OptionStatus || (exports.OptionStatus = OptionStatus = {}));
var MarginType;
(function (MarginType) {
    MarginType["INITIAL_MARGIN"] = "INITIAL_MARGIN";
    MarginType["MAINTENANCE_MARGIN"] = "MAINTENANCE_MARGIN";
    MarginType["VARIATION_MARGIN"] = "VARIATION_MARGIN";
    MarginType["SPAN_MARGIN"] = "SPAN_MARGIN";
    MarginType["PORTFOLIO_MARGIN"] = "PORTFOLIO_MARGIN";
})(MarginType || (exports.MarginType = MarginType = {}));
var VolatilityModel;
(function (VolatilityModel) {
    VolatilityModel["BLACK_SCHOLES"] = "BLACK_SCHOLES";
    VolatilityModel["BINOMIAL"] = "BINOMIAL";
    VolatilityModel["TRINOMIAL"] = "TRINOMIAL";
    VolatilityModel["MONTE_CARLO"] = "MONTE_CARLO";
    VolatilityModel["HESTON"] = "HESTON";
    VolatilityModel["LOCAL_VOLATILITY"] = "LOCAL_VOLATILITY";
})(VolatilityModel || (exports.VolatilityModel = VolatilityModel = {}));
var StrategyType;
(function (StrategyType) {
    StrategyType["SINGLE_OPTION"] = "SINGLE_OPTION";
    StrategyType["COVERED_CALL"] = "COVERED_CALL";
    StrategyType["PROTECTIVE_PUT"] = "PROTECTIVE_PUT";
    StrategyType["STRADDLE"] = "STRADDLE";
    StrategyType["STRANGLE"] = "STRANGLE";
    StrategyType["SPREAD_BULL_CALL"] = "SPREAD_BULL_CALL";
    StrategyType["SPREAD_BULL_PUT"] = "SPREAD_BULL_PUT";
    StrategyType["SPREAD_BEAR_CALL"] = "SPREAD_BEAR_CALL";
    StrategyType["SPREAD_BEAR_PUT"] = "SPREAD_BEAR_PUT";
    StrategyType["IRON_CONDOR"] = "IRON_CONDOR";
    StrategyType["IRON_BUTTERFLY"] = "IRON_BUTTERFLY";
    StrategyType["COLLAR"] = "COLLAR";
    StrategyType["CUSTOM"] = "CUSTOM";
})(StrategyType || (exports.StrategyType = StrategyType = {}));

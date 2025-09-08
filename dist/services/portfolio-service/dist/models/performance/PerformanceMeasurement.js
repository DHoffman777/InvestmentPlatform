"use strict";
// Performance Measurement Models and Types
// Comprehensive models for portfolio performance calculation and analysis
Object.defineProperty(exports, "__esModule", { value: true });
exports.RebalancingFrequency = exports.FactorModel = exports.AttributionMethod = exports.CashFlowTiming = exports.CalculationFrequency = exports.ValuationFrequency = exports.FeeCalculationMethod = exports.ReturnCalculationBasis = exports.RiskFactorType = exports.FactorType = exports.AttributionLevel = exports.AttributionType = exports.CalculationMethod = exports.PeriodType = void 0;
// Enums
var PeriodType;
(function (PeriodType) {
    PeriodType["DAILY"] = "DAILY";
    PeriodType["WEEKLY"] = "WEEKLY";
    PeriodType["MONTHLY"] = "MONTHLY";
    PeriodType["QUARTERLY"] = "QUARTERLY";
    PeriodType["SEMI_ANNUAL"] = "SEMI_ANNUAL";
    PeriodType["ANNUAL"] = "ANNUAL";
    PeriodType["INCEPTION_TO_DATE"] = "INCEPTION_TO_DATE";
    PeriodType["YEAR_TO_DATE"] = "YEAR_TO_DATE";
    PeriodType["CUSTOM"] = "CUSTOM";
})(PeriodType || (exports.PeriodType = PeriodType = {}));
var CalculationMethod;
(function (CalculationMethod) {
    CalculationMethod["TIME_WEIGHTED"] = "TIME_WEIGHTED";
    CalculationMethod["MONEY_WEIGHTED"] = "MONEY_WEIGHTED";
    CalculationMethod["SIMPLE"] = "SIMPLE";
    CalculationMethod["LOGARITHMIC"] = "LOGARITHMIC";
    CalculationMethod["MODIFIED_DIETZ"] = "MODIFIED_DIETZ";
    CalculationMethod["TRUE_TIME_WEIGHTED"] = "TRUE_TIME_WEIGHTED";
})(CalculationMethod || (exports.CalculationMethod = CalculationMethod = {}));
var AttributionType;
(function (AttributionType) {
    AttributionType["BRINSON_HOOD_BEEBOWER"] = "BRINSON_HOOD_BEEBOWER";
    AttributionType["BRINSON_FACHLER"] = "BRINSON_FACHLER";
    AttributionType["GEOMETRIC"] = "GEOMETRIC";
    AttributionType["ARITHMETIC"] = "ARITHMETIC";
    AttributionType["FACTOR_BASED"] = "FACTOR_BASED";
})(AttributionType || (exports.AttributionType = AttributionType = {}));
var AttributionLevel;
(function (AttributionLevel) {
    AttributionLevel["ASSET_CLASS"] = "ASSET_CLASS";
    AttributionLevel["SECTOR"] = "SECTOR";
    AttributionLevel["SECURITY"] = "SECURITY";
    AttributionLevel["FACTOR"] = "FACTOR";
    AttributionLevel["CURRENCY"] = "CURRENCY";
})(AttributionLevel || (exports.AttributionLevel = AttributionLevel = {}));
var FactorType;
(function (FactorType) {
    FactorType["FUNDAMENTAL"] = "FUNDAMENTAL";
    FactorType["MACROECONOMIC"] = "MACROECONOMIC";
    FactorType["STATISTICAL"] = "STATISTICAL";
    FactorType["RISK"] = "RISK";
    FactorType["STYLE"] = "STYLE";
})(FactorType || (exports.FactorType = FactorType = {}));
var RiskFactorType;
(function (RiskFactorType) {
    RiskFactorType["MARKET"] = "MARKET";
    RiskFactorType["SECTOR"] = "SECTOR";
    RiskFactorType["STYLE"] = "STYLE";
    RiskFactorType["CURRENCY"] = "CURRENCY";
    RiskFactorType["SPECIFIC"] = "SPECIFIC";
})(RiskFactorType || (exports.RiskFactorType = RiskFactorType = {}));
var ReturnCalculationBasis;
(function (ReturnCalculationBasis) {
    ReturnCalculationBasis["TRADE_DATE"] = "TRADE_DATE";
    ReturnCalculationBasis["SETTLEMENT_DATE"] = "SETTLEMENT_DATE";
    ReturnCalculationBasis["BOOK_DATE"] = "BOOK_DATE";
})(ReturnCalculationBasis || (exports.ReturnCalculationBasis = ReturnCalculationBasis = {}));
var FeeCalculationMethod;
(function (FeeCalculationMethod) {
    FeeCalculationMethod["ACTUAL"] = "ACTUAL";
    FeeCalculationMethod["MODEL"] = "MODEL";
    FeeCalculationMethod["HIGHEST_FEE"] = "HIGHEST_FEE";
    FeeCalculationMethod["COMPOSITE_FEE"] = "COMPOSITE_FEE";
})(FeeCalculationMethod || (exports.FeeCalculationMethod = FeeCalculationMethod = {}));
var ValuationFrequency;
(function (ValuationFrequency) {
    ValuationFrequency["DAILY"] = "DAILY";
    ValuationFrequency["WEEKLY"] = "WEEKLY";
    ValuationFrequency["MONTHLY"] = "MONTHLY";
    ValuationFrequency["QUARTERLY"] = "QUARTERLY";
})(ValuationFrequency || (exports.ValuationFrequency = ValuationFrequency = {}));
var CalculationFrequency;
(function (CalculationFrequency) {
    CalculationFrequency["REAL_TIME"] = "REAL_TIME";
    CalculationFrequency["DAILY"] = "DAILY";
    CalculationFrequency["WEEKLY"] = "WEEKLY";
    CalculationFrequency["MONTHLY"] = "MONTHLY";
})(CalculationFrequency || (exports.CalculationFrequency = CalculationFrequency = {}));
var CashFlowTiming;
(function (CashFlowTiming) {
    CashFlowTiming["BEGINNING_OF_DAY"] = "BEGINNING_OF_DAY";
    CashFlowTiming["END_OF_DAY"] = "END_OF_DAY";
    CashFlowTiming["ACTUAL_TIME"] = "ACTUAL_TIME";
    CashFlowTiming["MODIFIED_DIETZ"] = "MODIFIED_DIETZ";
})(CashFlowTiming || (exports.CashFlowTiming = CashFlowTiming = {}));
var AttributionMethod;
(function (AttributionMethod) {
    AttributionMethod["BRINSON"] = "BRINSON";
    AttributionMethod["GEOMETRIC"] = "GEOMETRIC";
    AttributionMethod["FACTOR_BASED"] = "FACTOR_BASED";
})(AttributionMethod || (exports.AttributionMethod = AttributionMethod = {}));
var FactorModel;
(function (FactorModel) {
    FactorModel["FAMA_FRENCH_3_FACTOR"] = "FAMA_FRENCH_3_FACTOR";
    FactorModel["FAMA_FRENCH_5_FACTOR"] = "FAMA_FRENCH_5_FACTOR";
    FactorModel["CARHART_4_FACTOR"] = "CARHART_4_FACTOR";
    FactorModel["CUSTOM"] = "CUSTOM";
})(FactorModel || (exports.FactorModel = FactorModel = {}));
var RebalancingFrequency;
(function (RebalancingFrequency) {
    RebalancingFrequency["DAILY"] = "DAILY";
    RebalancingFrequency["WEEKLY"] = "WEEKLY";
    RebalancingFrequency["MONTHLY"] = "MONTHLY";
    RebalancingFrequency["QUARTERLY"] = "QUARTERLY";
    RebalancingFrequency["ANNUALLY"] = "ANNUALLY";
})(RebalancingFrequency || (exports.RebalancingFrequency = RebalancingFrequency = {}));

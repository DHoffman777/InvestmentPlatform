"use strict";
// Structured Products Models
// Phase 4.1 - Comprehensive structured products support including structured notes, market-linked instruments, and exotic derivatives
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskLevel = exports.DocumentStatus = exports.UnderlyingType = exports.SettlementType = exports.ObservationFrequency = exports.PayoffType = exports.BarrierType = exports.StructuredProductType = void 0;
// Structured Product Types
var StructuredProductType;
(function (StructuredProductType) {
    StructuredProductType["STRUCTURED_NOTE"] = "STRUCTURED_NOTE";
    StructuredProductType["MARKET_LINKED_CD"] = "MARKET_LINKED_CD";
    StructuredProductType["REVERSE_CONVERTIBLE"] = "REVERSE_CONVERTIBLE";
    StructuredProductType["AUTOCALLABLE"] = "AUTOCALLABLE";
    StructuredProductType["BARRIER_OPTION"] = "BARRIER_OPTION";
    StructuredProductType["EXOTIC_DERIVATIVE"] = "EXOTIC_DERIVATIVE";
    StructuredProductType["EQUITY_LINKED"] = "EQUITY_LINKED";
    StructuredProductType["RATE_LINKED"] = "RATE_LINKED";
    StructuredProductType["COMMODITY_LINKED"] = "COMMODITY_LINKED";
    StructuredProductType["CURRENCY_LINKED"] = "CURRENCY_LINKED";
})(StructuredProductType || (exports.StructuredProductType = StructuredProductType = {}));
var BarrierType;
(function (BarrierType) {
    BarrierType["KNOCK_IN"] = "KNOCK_IN";
    BarrierType["KNOCK_OUT"] = "KNOCK_OUT";
    BarrierType["UP_AND_IN"] = "UP_AND_IN";
    BarrierType["UP_AND_OUT"] = "UP_AND_OUT";
    BarrierType["DOWN_AND_IN"] = "DOWN_AND_IN";
    BarrierType["DOWN_AND_OUT"] = "DOWN_AND_OUT";
    BarrierType["DOUBLE_BARRIER"] = "DOUBLE_BARRIER";
})(BarrierType || (exports.BarrierType = BarrierType = {}));
var PayoffType;
(function (PayoffType) {
    PayoffType["FIXED_COUPON"] = "FIXED_COUPON";
    PayoffType["FLOATING_COUPON"] = "FLOATING_COUPON";
    PayoffType["PARTICIPATION"] = "PARTICIPATION";
    PayoffType["LEVERAGED"] = "LEVERAGED";
    PayoffType["CAPPED"] = "CAPPED";
    PayoffType["FLOORED"] = "FLOORED";
    PayoffType["DIGITAL"] = "DIGITAL";
    PayoffType["BASKET"] = "BASKET";
})(PayoffType || (exports.PayoffType = PayoffType = {}));
var ObservationFrequency;
(function (ObservationFrequency) {
    ObservationFrequency["CONTINUOUS"] = "CONTINUOUS";
    ObservationFrequency["DAILY"] = "DAILY";
    ObservationFrequency["WEEKLY"] = "WEEKLY";
    ObservationFrequency["MONTHLY"] = "MONTHLY";
    ObservationFrequency["QUARTERLY"] = "QUARTERLY";
    ObservationFrequency["MATURITY_ONLY"] = "MATURITY_ONLY";
})(ObservationFrequency || (exports.ObservationFrequency = ObservationFrequency = {}));
var SettlementType;
(function (SettlementType) {
    SettlementType["CASH"] = "CASH";
    SettlementType["PHYSICAL"] = "PHYSICAL";
    SettlementType["ELECTION"] = "ELECTION";
})(SettlementType || (exports.SettlementType = SettlementType = {}));
var UnderlyingType;
(function (UnderlyingType) {
    UnderlyingType["SINGLE_STOCK"] = "SINGLE_STOCK";
    UnderlyingType["INDEX"] = "INDEX";
    UnderlyingType["BASKET"] = "BASKET";
    UnderlyingType["COMMODITY"] = "COMMODITY";
    UnderlyingType["CURRENCY"] = "CURRENCY";
    UnderlyingType["INTEREST_RATE"] = "INTEREST_RATE";
    UnderlyingType["CREDIT"] = "CREDIT";
    UnderlyingType["HYBRID"] = "HYBRID";
})(UnderlyingType || (exports.UnderlyingType = UnderlyingType = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["DRAFT"] = "DRAFT";
    DocumentStatus["PENDING_REVIEW"] = "PENDING_REVIEW";
    DocumentStatus["APPROVED"] = "APPROVED";
    DocumentStatus["ACTIVE"] = "ACTIVE";
    DocumentStatus["MATURED"] = "MATURED";
    DocumentStatus["CALLED"] = "CALLED";
    DocumentStatus["DEFAULTED"] = "DEFAULTED";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["VERY_HIGH"] = "VERY_HIGH";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));

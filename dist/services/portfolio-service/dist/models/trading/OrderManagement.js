"use strict";
// Order Management System (OMS) Data Models
// Comprehensive order lifecycle management with multi-asset support
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskSeverity = exports.RiskBreachType = exports.ComplianceSeverity = exports.ComplianceFlagType = exports.ExecutionInstructionType = exports.ExecutionStrategy = exports.RoutingAlgorithm = exports.AllocationMethod = exports.AllocationStatus = exports.SettlementStatus = exports.ExecutionVenueType = exports.PreTradeCheckStatus = exports.TradingSession = exports.OrderState = exports.OrderStatus = exports.TimeInForce = exports.OrderSide = exports.OrderType = void 0;
// Enums and Types
var OrderType;
(function (OrderType) {
    OrderType["MARKET"] = "MARKET";
    OrderType["LIMIT"] = "LIMIT";
    OrderType["STOP"] = "STOP";
    OrderType["STOP_LIMIT"] = "STOP_LIMIT";
    OrderType["MARKET_ON_CLOSE"] = "MARKET_ON_CLOSE";
    OrderType["LIMIT_ON_CLOSE"] = "LIMIT_ON_CLOSE";
    OrderType["ICEBERG"] = "ICEBERG";
    OrderType["HIDDEN"] = "HIDDEN";
    OrderType["PEGGED"] = "PEGGED";
    OrderType["BRACKET"] = "BRACKET";
    OrderType["ONE_CANCELS_OTHER"] = "ONE_CANCELS_OTHER";
    OrderType["ALGORITHMIC"] = "ALGORITHMIC";
})(OrderType || (exports.OrderType = OrderType = {}));
var OrderSide;
(function (OrderSide) {
    OrderSide["BUY"] = "BUY";
    OrderSide["SELL"] = "SELL";
    OrderSide["BUY_TO_COVER"] = "BUY_TO_COVER";
    OrderSide["SELL_SHORT"] = "SELL_SHORT";
})(OrderSide || (exports.OrderSide = OrderSide = {}));
var TimeInForce;
(function (TimeInForce) {
    TimeInForce["DAY"] = "DAY";
    TimeInForce["GOOD_TILL_CANCELED"] = "GOOD_TILL_CANCELED";
    TimeInForce["IMMEDIATE_OR_CANCEL"] = "IMMEDIATE_OR_CANCEL";
    TimeInForce["FILL_OR_KILL"] = "FILL_OR_KILL";
    TimeInForce["GOOD_TILL_DATE"] = "GOOD_TILL_DATE";
    TimeInForce["AT_THE_OPENING"] = "AT_THE_OPENING";
    TimeInForce["AT_THE_CLOSE"] = "AT_THE_CLOSE";
})(TimeInForce || (exports.TimeInForce = TimeInForce = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING_NEW"] = "PENDING_NEW";
    OrderStatus["NEW"] = "NEW";
    OrderStatus["PARTIALLY_FILLED"] = "PARTIALLY_FILLED";
    OrderStatus["FILLED"] = "FILLED";
    OrderStatus["CANCELED"] = "CANCELED";
    OrderStatus["PENDING_CANCEL"] = "PENDING_CANCEL";
    OrderStatus["REJECTED"] = "REJECTED";
    OrderStatus["EXPIRED"] = "EXPIRED";
    OrderStatus["SUSPENDED"] = "SUSPENDED";
    OrderStatus["CALCULATED"] = "CALCULATED";
    OrderStatus["STOPPED"] = "STOPPED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var OrderState;
(function (OrderState) {
    OrderState["CREATED"] = "CREATED";
    OrderState["VALIDATED"] = "VALIDATED";
    OrderState["SUBMITTED"] = "SUBMITTED";
    OrderState["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    OrderState["IN_MARKET"] = "IN_MARKET";
    OrderState["WORKING"] = "WORKING";
    OrderState["COMPLETED"] = "COMPLETED";
    OrderState["FAILED"] = "FAILED";
})(OrderState || (exports.OrderState = OrderState = {}));
var TradingSession;
(function (TradingSession) {
    TradingSession["PRE_MARKET"] = "PRE_MARKET";
    TradingSession["REGULAR"] = "REGULAR";
    TradingSession["POST_MARKET"] = "POST_MARKET";
    TradingSession["EXTENDED_HOURS"] = "EXTENDED_HOURS";
})(TradingSession || (exports.TradingSession = TradingSession = {}));
var PreTradeCheckStatus;
(function (PreTradeCheckStatus) {
    PreTradeCheckStatus["PENDING"] = "PENDING";
    PreTradeCheckStatus["PASSED"] = "PASSED";
    PreTradeCheckStatus["FAILED"] = "FAILED";
    PreTradeCheckStatus["WARNING"] = "WARNING";
    PreTradeCheckStatus["BYPASSED"] = "BYPASSED";
})(PreTradeCheckStatus || (exports.PreTradeCheckStatus = PreTradeCheckStatus = {}));
var ExecutionVenueType;
(function (ExecutionVenueType) {
    ExecutionVenueType["EXCHANGE"] = "EXCHANGE";
    ExecutionVenueType["DARK_POOL"] = "DARK_POOL";
    ExecutionVenueType["ECN"] = "ECN";
    ExecutionVenueType["MARKET_MAKER"] = "MARKET_MAKER";
    ExecutionVenueType["CROSSING_NETWORK"] = "CROSSING_NETWORK";
    ExecutionVenueType["INTERNAL"] = "INTERNAL";
})(ExecutionVenueType || (exports.ExecutionVenueType = ExecutionVenueType = {}));
var SettlementStatus;
(function (SettlementStatus) {
    SettlementStatus["PENDING"] = "PENDING";
    SettlementStatus["SETTLED"] = "SETTLED";
    SettlementStatus["FAILED"] = "FAILED";
    SettlementStatus["PARTIAL"] = "PARTIAL";
})(SettlementStatus || (exports.SettlementStatus = SettlementStatus = {}));
var AllocationStatus;
(function (AllocationStatus) {
    AllocationStatus["PENDING"] = "PENDING";
    AllocationStatus["ALLOCATED"] = "ALLOCATED";
    AllocationStatus["PARTIAL"] = "PARTIAL";
    AllocationStatus["FAILED"] = "FAILED";
})(AllocationStatus || (exports.AllocationStatus = AllocationStatus = {}));
var AllocationMethod;
(function (AllocationMethod) {
    AllocationMethod["PROPORTIONAL"] = "PROPORTIONAL";
    AllocationMethod["PRIORITY"] = "PRIORITY";
    AllocationMethod["MANUAL"] = "MANUAL";
    AllocationMethod["FIFO"] = "FIFO";
    AllocationMethod["PRO_RATA"] = "PRO_RATA";
})(AllocationMethod || (exports.AllocationMethod = AllocationMethod = {}));
var RoutingAlgorithm;
(function (RoutingAlgorithm) {
    RoutingAlgorithm["SMART_ORDER_ROUTING"] = "SMART_ORDER_ROUTING";
    RoutingAlgorithm["TWAP"] = "TWAP";
    RoutingAlgorithm["VWAP"] = "VWAP";
    RoutingAlgorithm["IMPLEMENTATION_SHORTFALL"] = "IMPLEMENTATION_SHORTFALL";
    RoutingAlgorithm["PARTICIPATION_RATE"] = "PARTICIPATION_RATE";
    RoutingAlgorithm["ARRIVAL_PRICE"] = "ARRIVAL_PRICE";
})(RoutingAlgorithm || (exports.RoutingAlgorithm = RoutingAlgorithm = {}));
var ExecutionStrategy;
(function (ExecutionStrategy) {
    ExecutionStrategy["AGGRESSIVE"] = "AGGRESSIVE";
    ExecutionStrategy["PASSIVE"] = "PASSIVE";
    ExecutionStrategy["NEUTRAL"] = "NEUTRAL";
    ExecutionStrategy["OPPORTUNISTIC"] = "OPPORTUNISTIC";
})(ExecutionStrategy || (exports.ExecutionStrategy = ExecutionStrategy = {}));
var ExecutionInstructionType;
(function (ExecutionInstructionType) {
    ExecutionInstructionType["NOT_HELD"] = "NOT_HELD";
    ExecutionInstructionType["WORK"] = "WORK";
    ExecutionInstructionType["GO_ALONG"] = "GO_ALONG";
    ExecutionInstructionType["OVER_THE_DAY"] = "OVER_THE_DAY";
    ExecutionInstructionType["HELD"] = "HELD";
    ExecutionInstructionType["PARTICIPATE_DONT_INITIATE"] = "PARTICIPATE_DONT_INITIATE";
    ExecutionInstructionType["STRICT_SCALE"] = "STRICT_SCALE";
    ExecutionInstructionType["TRY_TO_SCALE"] = "TRY_TO_SCALE";
    ExecutionInstructionType["STAY_ON_BID_SIDE"] = "STAY_ON_BID_SIDE";
    ExecutionInstructionType["STAY_ON_OFFER_SIDE"] = "STAY_ON_OFFER_SIDE";
    ExecutionInstructionType["NO_CROSS"] = "NO_CROSS";
    ExecutionInstructionType["OK_TO_CROSS"] = "OK_TO_CROSS";
    ExecutionInstructionType["CALL_FIRST"] = "CALL_FIRST";
    ExecutionInstructionType["PERCENT_OF_VOLUME"] = "PERCENT_OF_VOLUME";
})(ExecutionInstructionType || (exports.ExecutionInstructionType = ExecutionInstructionType = {}));
var ComplianceFlagType;
(function (ComplianceFlagType) {
    ComplianceFlagType["RESTRICTED_LIST"] = "RESTRICTED_LIST";
    ComplianceFlagType["CONCENTRATION_LIMIT"] = "CONCENTRATION_LIMIT";
    ComplianceFlagType["SUITABILITY"] = "SUITABILITY";
    ComplianceFlagType["WASH_SALE"] = "WASH_SALE";
    ComplianceFlagType["BEST_EXECUTION"] = "BEST_EXECUTION";
    ComplianceFlagType["REGULATORY_LIMIT"] = "REGULATORY_LIMIT";
})(ComplianceFlagType || (exports.ComplianceFlagType = ComplianceFlagType = {}));
var ComplianceSeverity;
(function (ComplianceSeverity) {
    ComplianceSeverity["INFO"] = "INFO";
    ComplianceSeverity["WARNING"] = "WARNING";
    ComplianceSeverity["ERROR"] = "ERROR";
    ComplianceSeverity["BLOCKING"] = "BLOCKING";
})(ComplianceSeverity || (exports.ComplianceSeverity = ComplianceSeverity = {}));
var RiskBreachType;
(function (RiskBreachType) {
    RiskBreachType["POSITION_LIMIT"] = "POSITION_LIMIT";
    RiskBreachType["EXPOSURE_LIMIT"] = "EXPOSURE_LIMIT";
    RiskBreachType["CONCENTRATION_LIMIT"] = "CONCENTRATION_LIMIT";
    RiskBreachType["VOLUME_LIMIT"] = "VOLUME_LIMIT";
    RiskBreachType["LIQUIDITY_RISK"] = "LIQUIDITY_RISK";
    RiskBreachType["MARKET_RISK"] = "MARKET_RISK";
})(RiskBreachType || (exports.RiskBreachType = RiskBreachType = {}));
var RiskSeverity;
(function (RiskSeverity) {
    RiskSeverity["LOW"] = "LOW";
    RiskSeverity["MEDIUM"] = "MEDIUM";
    RiskSeverity["HIGH"] = "HIGH";
    RiskSeverity["CRITICAL"] = "CRITICAL";
})(RiskSeverity || (exports.RiskSeverity = RiskSeverity = {}));

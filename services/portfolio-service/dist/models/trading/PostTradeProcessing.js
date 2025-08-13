"use strict";
// Post-Trade Processing Data Models
// This module defines all data structures for post-trade processing including
// trade confirmation, settlement, custodian integration, and regulatory reporting
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionCostAnalysisType = exports.RegulatoryReportStatus = exports.RegulatoryReportType = exports.CustodianMessageStatus = exports.CustodianMessageType = exports.SettlementInstructionStatus = exports.SettlementInstructionType = exports.TradeBreakStatus = exports.TradeBreakSeverity = exports.TradeBreakType = exports.TradeConfirmationStatus = void 0;
var TradeConfirmationStatus;
(function (TradeConfirmationStatus) {
    TradeConfirmationStatus["PENDING"] = "PENDING";
    TradeConfirmationStatus["CONFIRMED"] = "CONFIRMED";
    TradeConfirmationStatus["AFFIRMED"] = "AFFIRMED";
    TradeConfirmationStatus["REJECTED"] = "REJECTED";
    TradeConfirmationStatus["DISPUTED"] = "DISPUTED";
    TradeConfirmationStatus["CANCELLED"] = "CANCELLED";
})(TradeConfirmationStatus || (exports.TradeConfirmationStatus = TradeConfirmationStatus = {}));
var TradeBreakType;
(function (TradeBreakType) {
    TradeBreakType["PRICE_DISCREPANCY"] = "PRICE_DISCREPANCY";
    TradeBreakType["QUANTITY_DISCREPANCY"] = "QUANTITY_DISCREPANCY";
    TradeBreakType["SETTLEMENT_DISCREPANCY"] = "SETTLEMENT_DISCREPANCY";
    TradeBreakType["MISSING_COUNTERPARTY"] = "MISSING_COUNTERPARTY";
    TradeBreakType["INVALID_INSTRUMENT"] = "INVALID_INSTRUMENT";
    TradeBreakType["DUPLICATE_TRADE"] = "DUPLICATE_TRADE";
    TradeBreakType["LATE_MATCHING"] = "LATE_MATCHING";
})(TradeBreakType || (exports.TradeBreakType = TradeBreakType = {}));
var TradeBreakSeverity;
(function (TradeBreakSeverity) {
    TradeBreakSeverity["LOW"] = "LOW";
    TradeBreakSeverity["MEDIUM"] = "MEDIUM";
    TradeBreakSeverity["HIGH"] = "HIGH";
    TradeBreakSeverity["CRITICAL"] = "CRITICAL";
})(TradeBreakSeverity || (exports.TradeBreakSeverity = TradeBreakSeverity = {}));
var TradeBreakStatus;
(function (TradeBreakStatus) {
    TradeBreakStatus["OPEN"] = "OPEN";
    TradeBreakStatus["INVESTIGATING"] = "INVESTIGATING";
    TradeBreakStatus["RESOLVED"] = "RESOLVED";
    TradeBreakStatus["ESCALATED"] = "ESCALATED";
    TradeBreakStatus["CLOSED"] = "CLOSED";
})(TradeBreakStatus || (exports.TradeBreakStatus = TradeBreakStatus = {}));
var SettlementInstructionType;
(function (SettlementInstructionType) {
    SettlementInstructionType["DELIVERY_VERSUS_PAYMENT"] = "DVP";
    SettlementInstructionType["RECEIVE_VERSUS_PAYMENT"] = "RVP";
    SettlementInstructionType["FREE_OF_PAYMENT"] = "FOP";
    SettlementInstructionType["DELIVERY_FREE_OF_PAYMENT"] = "DFOP";
})(SettlementInstructionType || (exports.SettlementInstructionType = SettlementInstructionType = {}));
var SettlementInstructionStatus;
(function (SettlementInstructionStatus) {
    SettlementInstructionStatus["PENDING"] = "PENDING";
    SettlementInstructionStatus["SENT"] = "SENT";
    SettlementInstructionStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    SettlementInstructionStatus["MATCHED"] = "MATCHED";
    SettlementInstructionStatus["SETTLED"] = "SETTLED";
    SettlementInstructionStatus["FAILED"] = "FAILED";
    SettlementInstructionStatus["CANCELLED"] = "CANCELLED";
})(SettlementInstructionStatus || (exports.SettlementInstructionStatus = SettlementInstructionStatus = {}));
var CustodianMessageType;
(function (CustodianMessageType) {
    CustodianMessageType["SETTLEMENT_INSTRUCTION"] = "SETTLEMENT_INSTRUCTION";
    CustodianMessageType["POSITION_UPDATE"] = "POSITION_UPDATE";
    CustodianMessageType["CASH_BALANCE"] = "CASH_BALANCE";
    CustodianMessageType["CORPORATE_ACTION"] = "CORPORATE_ACTION";
    CustodianMessageType["TRADE_CONFIRMATION"] = "TRADE_CONFIRMATION";
    CustodianMessageType["ERROR_NOTIFICATION"] = "ERROR_NOTIFICATION";
})(CustodianMessageType || (exports.CustodianMessageType = CustodianMessageType = {}));
var CustodianMessageStatus;
(function (CustodianMessageStatus) {
    CustodianMessageStatus["PENDING"] = "PENDING";
    CustodianMessageStatus["SENT"] = "SENT";
    CustodianMessageStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    CustodianMessageStatus["PROCESSED"] = "PROCESSED";
    CustodianMessageStatus["FAILED"] = "FAILED";
    CustodianMessageStatus["RETRY"] = "RETRY";
})(CustodianMessageStatus || (exports.CustodianMessageStatus = CustodianMessageStatus = {}));
var RegulatoryReportType;
(function (RegulatoryReportType) {
    RegulatoryReportType["FORM_13F"] = "FORM_13F";
    RegulatoryReportType["FORM_PF"] = "FORM_PF";
    RegulatoryReportType["BEST_EXECUTION"] = "BEST_EXECUTION";
    RegulatoryReportType["TRADE_REPORTING_FACILITY"] = "TRF";
    RegulatoryReportType["CONSOLIDATED_AUDIT_TRAIL"] = "CAT";
    RegulatoryReportType["SWAP_DATA_REPOSITORY"] = "SDR";
    RegulatoryReportType["TRANSACTION_REPORTING"] = "TRANSACTION_REPORTING";
})(RegulatoryReportType || (exports.RegulatoryReportType = RegulatoryReportType = {}));
var RegulatoryReportStatus;
(function (RegulatoryReportStatus) {
    RegulatoryReportStatus["DRAFT"] = "DRAFT";
    RegulatoryReportStatus["PENDING_REVIEW"] = "PENDING_REVIEW";
    RegulatoryReportStatus["APPROVED"] = "APPROVED";
    RegulatoryReportStatus["SUBMITTED"] = "SUBMITTED";
    RegulatoryReportStatus["ACCEPTED"] = "ACCEPTED";
    RegulatoryReportStatus["REJECTED"] = "REJECTED";
    RegulatoryReportStatus["AMENDED"] = "AMENDED";
})(RegulatoryReportStatus || (exports.RegulatoryReportStatus = RegulatoryReportStatus = {}));
var TransactionCostAnalysisType;
(function (TransactionCostAnalysisType) {
    TransactionCostAnalysisType["IMPLEMENTATION_SHORTFALL"] = "IMPLEMENTATION_SHORTFALL";
    TransactionCostAnalysisType["VOLUME_WEIGHTED_AVERAGE_PRICE"] = "VWAP";
    TransactionCostAnalysisType["TIME_WEIGHTED_AVERAGE_PRICE"] = "TWAP";
    TransactionCostAnalysisType["ARRIVAL_PRICE"] = "ARRIVAL_PRICE";
    TransactionCostAnalysisType["MARKET_IMPACT"] = "MARKET_IMPACT";
    TransactionCostAnalysisType["TIMING_COST"] = "TIMING_COST";
})(TransactionCostAnalysisType || (exports.TransactionCostAnalysisType = TransactionCostAnalysisType = {}));

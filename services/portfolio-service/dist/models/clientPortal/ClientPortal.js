"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertPriority = exports.AlertType = exports.MessageStatus = exports.MessageType = exports.DashboardWidgetType = void 0;
var DashboardWidgetType;
(function (DashboardWidgetType) {
    DashboardWidgetType["PORTFOLIO_SUMMARY"] = "PORTFOLIO_SUMMARY";
    DashboardWidgetType["PERFORMANCE_CHART"] = "PERFORMANCE_CHART";
    DashboardWidgetType["ASSET_ALLOCATION"] = "ASSET_ALLOCATION";
    DashboardWidgetType["RECENT_TRANSACTIONS"] = "RECENT_TRANSACTIONS";
    DashboardWidgetType["MARKET_NEWS"] = "MARKET_NEWS";
    DashboardWidgetType["ACCOUNT_BALANCE"] = "ACCOUNT_BALANCE";
    DashboardWidgetType["WATCHLIST"] = "WATCHLIST";
    DashboardWidgetType["ALERTS"] = "ALERTS";
    DashboardWidgetType["DOCUMENTS"] = "DOCUMENTS";
    DashboardWidgetType["GOALS_PROGRESS"] = "GOALS_PROGRESS";
})(DashboardWidgetType || (exports.DashboardWidgetType = DashboardWidgetType = {}));
var MessageType;
(function (MessageType) {
    MessageType["GENERAL"] = "GENERAL";
    MessageType["ALERT"] = "ALERT";
    MessageType["STATEMENT"] = "STATEMENT";
    MessageType["TRADE_CONFIRMATION"] = "TRADE_CONFIRMATION";
    MessageType["DOCUMENT_NOTIFICATION"] = "DOCUMENT_NOTIFICATION";
    MessageType["SYSTEM_MAINTENANCE"] = "SYSTEM_MAINTENANCE";
})(MessageType || (exports.MessageType = MessageType = {}));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["UNREAD"] = "UNREAD";
    MessageStatus["READ"] = "READ";
    MessageStatus["ARCHIVED"] = "ARCHIVED";
    MessageStatus["DELETED"] = "DELETED";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
var AlertType;
(function (AlertType) {
    AlertType["PRICE_ALERT"] = "PRICE_ALERT";
    AlertType["PORTFOLIO_ALERT"] = "PORTFOLIO_ALERT";
    AlertType["COMPLIANCE_ALERT"] = "COMPLIANCE_ALERT";
    AlertType["DOCUMENT_ALERT"] = "DOCUMENT_ALERT";
    AlertType["SYSTEM_ALERT"] = "SYSTEM_ALERT";
    AlertType["MARKET_ALERT"] = "MARKET_ALERT";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertPriority;
(function (AlertPriority) {
    AlertPriority["LOW"] = "LOW";
    AlertPriority["MEDIUM"] = "MEDIUM";
    AlertPriority["HIGH"] = "HIGH";
    AlertPriority["CRITICAL"] = "CRITICAL";
})(AlertPriority || (exports.AlertPriority = AlertPriority = {}));

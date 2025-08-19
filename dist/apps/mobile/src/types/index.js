"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagePriority = exports.DocumentType = exports.AlertSeverity = exports.AlertType = exports.TransactionStatus = exports.TransactionType = exports.AssetType = void 0;
var AssetType;
(function (AssetType) {
    AssetType["EQUITY"] = "EQUITY";
    AssetType["FIXED_INCOME"] = "FIXED_INCOME";
    AssetType["ETF"] = "ETF";
    AssetType["MUTUAL_FUND"] = "MUTUAL_FUND";
    AssetType["REIT"] = "REIT";
    AssetType["CASH"] = "CASH";
    AssetType["ALTERNATIVE"] = "ALTERNATIVE";
    AssetType["DERIVATIVE"] = "DERIVATIVE";
})(AssetType || (exports.AssetType = AssetType = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["BUY"] = "BUY";
    TransactionType["SELL"] = "SELL";
    TransactionType["DIVIDEND"] = "DIVIDEND";
    TransactionType["INTEREST"] = "INTEREST";
    TransactionType["DEPOSIT"] = "DEPOSIT";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
    TransactionType["TRANSFER_IN"] = "TRANSFER_IN";
    TransactionType["TRANSFER_OUT"] = "TRANSFER_OUT";
    TransactionType["FEE"] = "FEE";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["SETTLED"] = "SETTLED";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["CANCELLED"] = "CANCELLED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var AlertType;
(function (AlertType) {
    AlertType["PRICE_ALERT"] = "PRICE_ALERT";
    AlertType["PORTFOLIO_PERFORMANCE"] = "PORTFOLIO_PERFORMANCE";
    AlertType["MARKET_NEWS"] = "MARKET_NEWS";
    AlertType["SECURITY_ALERT"] = "SECURITY_ALERT";
    AlertType["SYSTEM_MAINTENANCE"] = "SYSTEM_MAINTENANCE";
    AlertType["ACCOUNT_UPDATE"] = "ACCOUNT_UPDATE";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "LOW";
    AlertSeverity["MEDIUM"] = "MEDIUM";
    AlertSeverity["HIGH"] = "HIGH";
    AlertSeverity["CRITICAL"] = "CRITICAL";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["STATEMENT"] = "STATEMENT";
    DocumentType["CONFIRMATION"] = "CONFIRMATION";
    DocumentType["TAX_DOCUMENT"] = "TAX_DOCUMENT";
    DocumentType["PROSPECTUS"] = "PROSPECTUS";
    DocumentType["REPORT"] = "REPORT";
    DocumentType["CONTRACT"] = "CONTRACT";
    DocumentType["OTHER"] = "OTHER";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var MessagePriority;
(function (MessagePriority) {
    MessagePriority["LOW"] = "LOW";
    MessagePriority["NORMAL"] = "NORMAL";
    MessagePriority["HIGH"] = "HIGH";
    MessagePriority["URGENT"] = "URGENT";
})(MessagePriority || (exports.MessagePriority = MessagePriority = {}));

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileProcessingStatus = exports.ReconciliationStatus = exports.DataFeedType = exports.APIConnectionType = exports.CustodianConnectionStatus = exports.CustodianType = void 0;
var CustodianType;
(function (CustodianType) {
    CustodianType["SCHWAB"] = "SCHWAB";
    CustodianType["FIDELITY"] = "FIDELITY";
    CustodianType["PERSHING"] = "PERSHING";
    CustodianType["BNY_MELLON"] = "BNY_MELLON";
    CustodianType["STATE_STREET"] = "STATE_STREET";
    CustodianType["JP_MORGAN"] = "JP_MORGAN";
    CustodianType["NORTHERN_TRUST"] = "NORTHERN_TRUST";
    CustodianType["CUSTOM"] = "CUSTOM";
})(CustodianType || (exports.CustodianType = CustodianType = {}));
var CustodianConnectionStatus;
(function (CustodianConnectionStatus) {
    CustodianConnectionStatus["CONNECTED"] = "CONNECTED";
    CustodianConnectionStatus["DISCONNECTED"] = "DISCONNECTED";
    CustodianConnectionStatus["CONNECTING"] = "CONNECTING";
    CustodianConnectionStatus["ERROR"] = "ERROR";
    CustodianConnectionStatus["SUSPENDED"] = "SUSPENDED";
    CustodianConnectionStatus["MAINTENANCE"] = "MAINTENANCE";
})(CustodianConnectionStatus || (exports.CustodianConnectionStatus = CustodianConnectionStatus = {}));
var APIConnectionType;
(function (APIConnectionType) {
    APIConnectionType["REST_API"] = "REST_API";
    APIConnectionType["SFTP"] = "SFTP";
    APIConnectionType["FTP"] = "FTP";
    APIConnectionType["WEBSOCKET"] = "WEBSOCKET";
    APIConnectionType["DIRECT_CONNECT"] = "DIRECT_CONNECT";
    APIConnectionType["FILE_BASED"] = "FILE_BASED";
})(APIConnectionType || (exports.APIConnectionType = APIConnectionType = {}));
var DataFeedType;
(function (DataFeedType) {
    DataFeedType["POSITIONS"] = "POSITIONS";
    DataFeedType["TRANSACTIONS"] = "TRANSACTIONS";
    DataFeedType["CASH_BALANCES"] = "CASH_BALANCES";
    DataFeedType["CORPORATE_ACTIONS"] = "CORPORATE_ACTIONS";
    DataFeedType["SETTLEMENTS"] = "SETTLEMENTS";
    DataFeedType["DIVIDENDS"] = "DIVIDENDS";
    DataFeedType["INTEREST"] = "INTEREST";
    DataFeedType["FEES"] = "FEES";
    DataFeedType["TAX_LOTS"] = "TAX_LOTS";
    DataFeedType["MARKET_DATA"] = "MARKET_DATA";
})(DataFeedType || (exports.DataFeedType = DataFeedType = {}));
var ReconciliationStatus;
(function (ReconciliationStatus) {
    ReconciliationStatus["MATCHED"] = "MATCHED";
    ReconciliationStatus["UNMATCHED"] = "UNMATCHED";
    ReconciliationStatus["PARTIALLY_MATCHED"] = "PARTIALLY_MATCHED";
    ReconciliationStatus["PENDING_REVIEW"] = "PENDING_REVIEW";
    ReconciliationStatus["RESOLVED"] = "RESOLVED";
    ReconciliationStatus["EXCEPTION"] = "EXCEPTION";
})(ReconciliationStatus || (exports.ReconciliationStatus = ReconciliationStatus = {}));
var FileProcessingStatus;
(function (FileProcessingStatus) {
    FileProcessingStatus["PENDING"] = "PENDING";
    FileProcessingStatus["PROCESSING"] = "PROCESSING";
    FileProcessingStatus["COMPLETED"] = "COMPLETED";
    FileProcessingStatus["FAILED"] = "FAILED";
    FileProcessingStatus["PARTIAL_SUCCESS"] = "PARTIAL_SUCCESS";
    FileProcessingStatus["SKIPPED"] = "SKIPPED";
})(FileProcessingStatus || (exports.FileProcessingStatus = FileProcessingStatus = {}));

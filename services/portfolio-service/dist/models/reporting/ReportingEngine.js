"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregationLevel = exports.ReportStatus = exports.ReportFrequency = exports.ReportFormat = exports.ReportType = void 0;
var ReportType;
(function (ReportType) {
    ReportType["PERFORMANCE"] = "PERFORMANCE";
    ReportType["ATTRIBUTION"] = "ATTRIBUTION";
    ReportType["HOLDINGS"] = "HOLDINGS";
    ReportType["ALLOCATION"] = "ALLOCATION";
    ReportType["TRANSACTION"] = "TRANSACTION";
    ReportType["FEE"] = "FEE";
    ReportType["COMPLIANCE"] = "COMPLIANCE";
    ReportType["REGULATORY"] = "REGULATORY";
    ReportType["TAX"] = "TAX";
    ReportType["RISK"] = "RISK";
    ReportType["CASH_FLOW"] = "CASH_FLOW";
    ReportType["CUSTOM"] = "CUSTOM";
})(ReportType || (exports.ReportType = ReportType = {}));
var ReportFormat;
(function (ReportFormat) {
    ReportFormat["PDF"] = "PDF";
    ReportFormat["EXCEL"] = "EXCEL";
    ReportFormat["CSV"] = "CSV";
    ReportFormat["HTML"] = "HTML";
    ReportFormat["JSON"] = "JSON";
    ReportFormat["XML"] = "XML";
})(ReportFormat || (exports.ReportFormat = ReportFormat = {}));
var ReportFrequency;
(function (ReportFrequency) {
    ReportFrequency["ON_DEMAND"] = "ON_DEMAND";
    ReportFrequency["DAILY"] = "DAILY";
    ReportFrequency["WEEKLY"] = "WEEKLY";
    ReportFrequency["MONTHLY"] = "MONTHLY";
    ReportFrequency["QUARTERLY"] = "QUARTERLY";
    ReportFrequency["SEMI_ANNUAL"] = "SEMI_ANNUAL";
    ReportFrequency["ANNUAL"] = "ANNUAL";
})(ReportFrequency || (exports.ReportFrequency = ReportFrequency = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["DRAFT"] = "DRAFT";
    ReportStatus["PENDING"] = "PENDING";
    ReportStatus["GENERATING"] = "GENERATING";
    ReportStatus["COMPLETED"] = "COMPLETED";
    ReportStatus["FAILED"] = "FAILED";
    ReportStatus["CANCELLED"] = "CANCELLED";
    ReportStatus["SCHEDULED"] = "SCHEDULED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var AggregationLevel;
(function (AggregationLevel) {
    AggregationLevel["ACCOUNT"] = "ACCOUNT";
    AggregationLevel["PORTFOLIO"] = "PORTFOLIO";
    AggregationLevel["CLIENT"] = "CLIENT";
    AggregationLevel["HOUSEHOLD"] = "HOUSEHOLD";
    AggregationLevel["ENTITY"] = "ENTITY";
    AggregationLevel["SECTOR"] = "SECTOR";
    AggregationLevel["ASSET_CLASS"] = "ASSET_CLASS";
    AggregationLevel["SECURITY"] = "SECURITY";
})(AggregationLevel || (exports.AggregationLevel = AggregationLevel = {}));

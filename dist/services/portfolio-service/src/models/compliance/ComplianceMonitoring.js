"use strict";
// Compliance Monitoring Models
// Phase 3.6 - Comprehensive compliance monitoring and regulatory oversight
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionType = exports.WorkflowStatus = exports.MonitoringFrequency = exports.BreachSeverity = exports.ComplianceStatus = exports.ComplianceRuleType = void 0;
var ComplianceRuleType;
(function (ComplianceRuleType) {
    ComplianceRuleType["INVESTMENT_GUIDELINE"] = "INVESTMENT_GUIDELINE";
    ComplianceRuleType["CONCENTRATION_LIMIT"] = "CONCENTRATION_LIMIT";
    ComplianceRuleType["RESTRICTED_LIST"] = "RESTRICTED_LIST";
    ComplianceRuleType["SUITABILITY_CHECK"] = "SUITABILITY_CHECK";
    ComplianceRuleType["REGULATORY_LIMIT"] = "REGULATORY_LIMIT";
    ComplianceRuleType["RISK_LIMIT"] = "RISK_LIMIT";
    ComplianceRuleType["SECTOR_LIMIT"] = "SECTOR_LIMIT";
    ComplianceRuleType["ASSET_CLASS_LIMIT"] = "ASSET_CLASS_LIMIT";
    ComplianceRuleType["LIQUIDITY_REQUIREMENT"] = "LIQUIDITY_REQUIREMENT";
    ComplianceRuleType["ESG_CRITERIA"] = "ESG_CRITERIA";
})(ComplianceRuleType || (exports.ComplianceRuleType = ComplianceRuleType = {}));
var ComplianceStatus;
(function (ComplianceStatus) {
    ComplianceStatus["COMPLIANT"] = "COMPLIANT";
    ComplianceStatus["WARNING"] = "WARNING";
    ComplianceStatus["BREACH"] = "BREACH";
    ComplianceStatus["PENDING_REVIEW"] = "PENDING_REVIEW";
    ComplianceStatus["WAIVED"] = "WAIVED";
})(ComplianceStatus || (exports.ComplianceStatus = ComplianceStatus = {}));
var BreachSeverity;
(function (BreachSeverity) {
    BreachSeverity["LOW"] = "LOW";
    BreachSeverity["MEDIUM"] = "MEDIUM";
    BreachSeverity["HIGH"] = "HIGH";
    BreachSeverity["CRITICAL"] = "CRITICAL";
})(BreachSeverity || (exports.BreachSeverity = BreachSeverity = {}));
var MonitoringFrequency;
(function (MonitoringFrequency) {
    MonitoringFrequency["REAL_TIME"] = "REAL_TIME";
    MonitoringFrequency["DAILY"] = "DAILY";
    MonitoringFrequency["WEEKLY"] = "WEEKLY";
    MonitoringFrequency["MONTHLY"] = "MONTHLY";
    MonitoringFrequency["QUARTERLY"] = "QUARTERLY";
})(MonitoringFrequency || (exports.MonitoringFrequency = MonitoringFrequency = {}));
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["PENDING"] = "PENDING";
    WorkflowStatus["IN_PROGRESS"] = "IN_PROGRESS";
    WorkflowStatus["RESOLVED"] = "RESOLVED";
    WorkflowStatus["ESCALATED"] = "ESCALATED";
    WorkflowStatus["CANCELLED"] = "CANCELLED";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
var ActionType;
(function (ActionType) {
    ActionType["AUTOMATIC_BLOCK"] = "AUTOMATIC_BLOCK";
    ActionType["REQUIRE_APPROVAL"] = "REQUIRE_APPROVAL";
    ActionType["ALERT_ONLY"] = "ALERT_ONLY";
    ActionType["SOFT_WARNING"] = "SOFT_WARNING";
})(ActionType || (exports.ActionType = ActionType = {}));

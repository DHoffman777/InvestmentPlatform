"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLAReportType = exports.SLANotificationChannel = exports.SLAStatus = exports.SLASeverity = exports.SLAMetricType = void 0;
var SLAMetricType;
(function (SLAMetricType) {
    SLAMetricType["AVAILABILITY"] = "availability";
    SLAMetricType["RESPONSE_TIME"] = "response_time";
    SLAMetricType["THROUGHPUT"] = "throughput";
    SLAMetricType["ERROR_RATE"] = "error_rate";
    SLAMetricType["UPTIME"] = "uptime";
    SLAMetricType["TRANSACTION_SUCCESS_RATE"] = "transaction_success_rate";
    SLAMetricType["DATA_ACCURACY"] = "data_accuracy";
    SLAMetricType["RECOVERY_TIME"] = "recovery_time";
    SLAMetricType["CUSTOMER_SATISFACTION"] = "customer_satisfaction";
    SLAMetricType["SECURITY_COMPLIANCE"] = "security_compliance";
    SLAMetricType["BUSINESS_CONTINUITY"] = "business_continuity";
    SLAMetricType["CUSTOM"] = "custom";
})(SLAMetricType || (exports.SLAMetricType = SLAMetricType = {}));
var SLASeverity;
(function (SLASeverity) {
    SLASeverity["CRITICAL"] = "critical";
    SLASeverity["HIGH"] = "high";
    SLASeverity["MEDIUM"] = "medium";
    SLASeverity["LOW"] = "low";
    SLASeverity["INFO"] = "info";
})(SLASeverity || (exports.SLASeverity = SLASeverity = {}));
var SLAStatus;
(function (SLAStatus) {
    SLAStatus["COMPLIANT"] = "compliant";
    SLAStatus["AT_RISK"] = "at_risk";
    SLAStatus["BREACHED"] = "breached";
    SLAStatus["UNKNOWN"] = "unknown";
    SLAStatus["MAINTENANCE"] = "maintenance";
})(SLAStatus || (exports.SLAStatus = SLAStatus = {}));
var SLANotificationChannel;
(function (SLANotificationChannel) {
    SLANotificationChannel["EMAIL"] = "email";
    SLANotificationChannel["SMS"] = "sms";
    SLANotificationChannel["SLACK"] = "slack";
    SLANotificationChannel["TEAMS"] = "teams";
    SLANotificationChannel["WEBHOOK"] = "webhook";
    SLANotificationChannel["DASHBOARD"] = "dashboard";
    SLANotificationChannel["MOBILE_PUSH"] = "mobile_push";
})(SLANotificationChannel || (exports.SLANotificationChannel = SLANotificationChannel = {}));
var SLAReportType;
(function (SLAReportType) {
    SLAReportType["DAILY"] = "daily";
    SLAReportType["WEEKLY"] = "weekly";
    SLAReportType["MONTHLY"] = "monthly";
    SLAReportType["QUARTERLY"] = "quarterly";
    SLAReportType["YEARLY"] = "yearly";
    SLAReportType["CUSTOM_PERIOD"] = "custom_period";
    SLAReportType["REAL_TIME"] = "real_time";
    SLAReportType["BREACH_SUMMARY"] = "breach_summary";
    SLAReportType["COMPLIANCE_SCORECARD"] = "compliance_scorecard";
})(SLAReportType || (exports.SLAReportType = SLAReportType = {}));

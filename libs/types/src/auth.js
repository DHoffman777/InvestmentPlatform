"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = exports.Permission = exports.MfaMethod = void 0;
var MfaMethod;
(function (MfaMethod) {
    MfaMethod["SMS"] = "SMS";
    MfaMethod["TOTP"] = "TOTP";
    MfaMethod["EMAIL"] = "EMAIL";
    MfaMethod["HARDWARE_TOKEN"] = "HARDWARE_TOKEN";
})(MfaMethod || (exports.MfaMethod = MfaMethod = {}));
var Permission;
(function (Permission) {
    // User Management
    Permission["USER_CREATE"] = "user:create";
    Permission["USER_READ"] = "user:read";
    Permission["USER_UPDATE"] = "user:update";
    Permission["USER_DELETE"] = "user:delete";
    // Portfolio Management
    Permission["PORTFOLIO_CREATE"] = "portfolio:create";
    Permission["PORTFOLIO_READ"] = "portfolio:read";
    Permission["PORTFOLIO_UPDATE"] = "portfolio:update";
    Permission["PORTFOLIO_DELETE"] = "portfolio:delete";
    // Trading
    Permission["TRADE_EXECUTE"] = "trade:execute";
    Permission["TRADE_APPROVE"] = "trade:approve";
    Permission["TRADE_VIEW"] = "trade:view";
    // Reporting
    Permission["REPORT_GENERATE"] = "report:generate";
    Permission["REPORT_VIEW"] = "report:view";
    Permission["REPORT_EXPORT"] = "report:export";
    // Admin
    Permission["ADMIN_TENANT"] = "admin:tenant";
    Permission["ADMIN_SYSTEM"] = "admin:system";
})(Permission || (exports.Permission = Permission = {}));
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "super_admin";
    Role["ADMIN"] = "admin";
    Role["PORTFOLIO_MANAGER"] = "portfolio_manager";
    Role["ANALYST"] = "analyst";
    Role["OPERATIONS"] = "operations";
    Role["COMPLIANCE_OFFICER"] = "compliance_officer";
    Role["CLIENT_SERVICE"] = "client_service";
    Role["AUDITOR"] = "auditor";
})(Role || (exports.Role = Role = {}));

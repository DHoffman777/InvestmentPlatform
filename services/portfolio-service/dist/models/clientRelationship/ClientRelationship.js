"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingStatus = exports.MeetingType = exports.RelationshipType = exports.CommunicationMethod = exports.LiquidityNeeds = exports.InvestmentExperience = exports.RiskTolerance = exports.ClientStatus = exports.ClientType = void 0;
// Client Profile Types
var ClientType;
(function (ClientType) {
    ClientType["INDIVIDUAL"] = "INDIVIDUAL";
    ClientType["JOINT"] = "JOINT";
    ClientType["ENTITY"] = "ENTITY";
    ClientType["TRUST"] = "TRUST";
    ClientType["RETIREMENT"] = "RETIREMENT";
    ClientType["CORPORATE"] = "CORPORATE";
})(ClientType || (exports.ClientType = ClientType = {}));
var ClientStatus;
(function (ClientStatus) {
    ClientStatus["ACTIVE"] = "ACTIVE";
    ClientStatus["INACTIVE"] = "INACTIVE";
    ClientStatus["PROSPECT"] = "PROSPECT";
    ClientStatus["SUSPENDED"] = "SUSPENDED";
    ClientStatus["CLOSED"] = "CLOSED";
})(ClientStatus || (exports.ClientStatus = ClientStatus = {}));
var RiskTolerance;
(function (RiskTolerance) {
    RiskTolerance["CONSERVATIVE"] = "CONSERVATIVE";
    RiskTolerance["MODERATE_CONSERVATIVE"] = "MODERATE_CONSERVATIVE";
    RiskTolerance["MODERATE"] = "MODERATE";
    RiskTolerance["MODERATE_AGGRESSIVE"] = "MODERATE_AGGRESSIVE";
    RiskTolerance["AGGRESSIVE"] = "AGGRESSIVE";
})(RiskTolerance || (exports.RiskTolerance = RiskTolerance = {}));
var InvestmentExperience;
(function (InvestmentExperience) {
    InvestmentExperience["NOVICE"] = "NOVICE";
    InvestmentExperience["LIMITED"] = "LIMITED";
    InvestmentExperience["MODERATE"] = "MODERATE";
    InvestmentExperience["EXTENSIVE"] = "EXTENSIVE";
    InvestmentExperience["PROFESSIONAL"] = "PROFESSIONAL";
})(InvestmentExperience || (exports.InvestmentExperience = InvestmentExperience = {}));
var LiquidityNeeds;
(function (LiquidityNeeds) {
    LiquidityNeeds["LOW"] = "LOW";
    LiquidityNeeds["MODERATE"] = "MODERATE";
    LiquidityNeeds["HIGH"] = "HIGH";
    LiquidityNeeds["IMMEDIATE"] = "IMMEDIATE";
})(LiquidityNeeds || (exports.LiquidityNeeds = LiquidityNeeds = {}));
// DocumentDeliveryPreference is now imported from Prisma above
var CommunicationMethod;
(function (CommunicationMethod) {
    CommunicationMethod["EMAIL"] = "EMAIL";
    CommunicationMethod["PHONE"] = "PHONE";
    CommunicationMethod["SMS"] = "SMS";
    CommunicationMethod["MAIL"] = "MAIL";
    CommunicationMethod["SECURE_MESSAGE"] = "SECURE_MESSAGE";
})(CommunicationMethod || (exports.CommunicationMethod = CommunicationMethod = {}));
var RelationshipType;
(function (RelationshipType) {
    RelationshipType["PRIMARY"] = "PRIMARY";
    RelationshipType["JOINT_OWNER"] = "JOINT_OWNER";
    RelationshipType["BENEFICIARY"] = "BENEFICIARY";
    RelationshipType["TRUSTEE"] = "TRUSTEE";
    RelationshipType["POWER_OF_ATTORNEY"] = "POWER_OF_ATTORNEY";
    RelationshipType["GUARDIAN"] = "GUARDIAN";
    RelationshipType["CUSTODIAN"] = "CUSTODIAN";
    RelationshipType["AUTHORIZED_TRADER"] = "AUTHORIZED_TRADER";
})(RelationshipType || (exports.RelationshipType = RelationshipType = {}));
var MeetingType;
(function (MeetingType) {
    MeetingType["INITIAL_CONSULTATION"] = "INITIAL_CONSULTATION";
    MeetingType["PORTFOLIO_REVIEW"] = "PORTFOLIO_REVIEW";
    MeetingType["FINANCIAL_PLANNING"] = "FINANCIAL_PLANNING";
    MeetingType["INVESTMENT_DISCUSSION"] = "INVESTMENT_DISCUSSION";
    MeetingType["ADMINISTRATIVE"] = "ADMINISTRATIVE";
    MeetingType["COMPLAINT_RESOLUTION"] = "COMPLAINT_RESOLUTION";
    MeetingType["FOLLOW_UP"] = "FOLLOW_UP";
})(MeetingType || (exports.MeetingType = MeetingType = {}));
var OnboardingStatus;
(function (OnboardingStatus) {
    OnboardingStatus["NOT_STARTED"] = "NOT_STARTED";
    OnboardingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    OnboardingStatus["DOCUMENTATION_PENDING"] = "DOCUMENTATION_PENDING";
    OnboardingStatus["COMPLIANCE_REVIEW"] = "COMPLIANCE_REVIEW";
    OnboardingStatus["APPROVED"] = "APPROVED";
    OnboardingStatus["REJECTED"] = "REJECTED";
    OnboardingStatus["COMPLETED"] = "COMPLETED";
})(OnboardingStatus || (exports.OnboardingStatus = OnboardingStatus = {}));

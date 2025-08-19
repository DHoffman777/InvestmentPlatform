"use strict";
// Alternative Investments Models
// Phase 4.2 - Comprehensive alternative investments support including private equity, hedge funds, real estate, and infrastructure
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentType = exports.SectorFocus = exports.GeographicFocus = exports.ValuationMethod = exports.DistributionType = exports.CommitmentStatus = exports.FundStatus = exports.InvestmentStage = exports.AlternativeInvestmentType = void 0;
// Alternative Investment Types
var AlternativeInvestmentType;
(function (AlternativeInvestmentType) {
    AlternativeInvestmentType["PRIVATE_EQUITY"] = "PRIVATE_EQUITY";
    AlternativeInvestmentType["HEDGE_FUND"] = "HEDGE_FUND";
    AlternativeInvestmentType["VENTURE_CAPITAL"] = "VENTURE_CAPITAL";
    AlternativeInvestmentType["REAL_ESTATE"] = "REAL_ESTATE";
    AlternativeInvestmentType["INFRASTRUCTURE"] = "INFRASTRUCTURE";
    AlternativeInvestmentType["COMMODITY_FUND"] = "COMMODITY_FUND";
    AlternativeInvestmentType["PRIVATE_DEBT"] = "PRIVATE_DEBT";
    AlternativeInvestmentType["FUND_OF_FUNDS"] = "FUND_OF_FUNDS";
    AlternativeInvestmentType["DIRECT_INVESTMENT"] = "DIRECT_INVESTMENT";
    AlternativeInvestmentType["REIT_PRIVATE"] = "REIT_PRIVATE";
})(AlternativeInvestmentType || (exports.AlternativeInvestmentType = AlternativeInvestmentType = {}));
var InvestmentStage;
(function (InvestmentStage) {
    InvestmentStage["SEED"] = "SEED";
    InvestmentStage["SERIES_A"] = "SERIES_A";
    InvestmentStage["SERIES_B"] = "SERIES_B";
    InvestmentStage["SERIES_C"] = "SERIES_C";
    InvestmentStage["LATE_STAGE"] = "LATE_STAGE";
    InvestmentStage["GROWTH"] = "GROWTH";
    InvestmentStage["BUYOUT"] = "BUYOUT";
    InvestmentStage["DISTRESSED"] = "DISTRESSED";
    InvestmentStage["TURNAROUND"] = "TURNAROUND";
    InvestmentStage["MEZZANINE"] = "MEZZANINE";
})(InvestmentStage || (exports.InvestmentStage = InvestmentStage = {}));
var FundStatus;
(function (FundStatus) {
    FundStatus["FUNDRAISING"] = "FUNDRAISING";
    FundStatus["INVESTING"] = "INVESTING";
    FundStatus["HARVESTING"] = "HARVESTING";
    FundStatus["LIQUIDATING"] = "LIQUIDATING";
    FundStatus["CLOSED"] = "CLOSED";
})(FundStatus || (exports.FundStatus = FundStatus = {}));
var CommitmentStatus;
(function (CommitmentStatus) {
    CommitmentStatus["COMMITTED"] = "COMMITTED";
    CommitmentStatus["CALLED"] = "CALLED";
    CommitmentStatus["INVESTED"] = "INVESTED";
    CommitmentStatus["REALIZED"] = "REALIZED";
    CommitmentStatus["WRITTEN_OFF"] = "WRITTEN_OFF";
})(CommitmentStatus || (exports.CommitmentStatus = CommitmentStatus = {}));
var DistributionType;
(function (DistributionType) {
    DistributionType["CASH"] = "CASH";
    DistributionType["STOCK"] = "STOCK";
    DistributionType["PIK"] = "PIK";
    DistributionType["RETURN_OF_CAPITAL"] = "RETURN_OF_CAPITAL";
    DistributionType["CAPITAL_GAIN"] = "CAPITAL_GAIN";
})(DistributionType || (exports.DistributionType = DistributionType = {}));
var ValuationMethod;
(function (ValuationMethod) {
    ValuationMethod["MARKET_MULTIPLE"] = "MARKET_MULTIPLE";
    ValuationMethod["DCF"] = "DCF";
    ValuationMethod["TRANSACTION_MULTIPLE"] = "TRANSACTION_MULTIPLE";
    ValuationMethod["ASSET_BASED"] = "ASSET_BASED";
    ValuationMethod["COST_BASIS"] = "COST_BASIS";
    ValuationMethod["THIRD_PARTY"] = "THIRD_PARTY";
    ValuationMethod["MARK_TO_MARKET"] = "MARK_TO_MARKET";
})(ValuationMethod || (exports.ValuationMethod = ValuationMethod = {}));
var GeographicFocus;
(function (GeographicFocus) {
    GeographicFocus["NORTH_AMERICA"] = "NORTH_AMERICA";
    GeographicFocus["EUROPE"] = "EUROPE";
    GeographicFocus["ASIA_PACIFIC"] = "ASIA_PACIFIC";
    GeographicFocus["EMERGING_MARKETS"] = "EMERGING_MARKETS";
    GeographicFocus["GLOBAL"] = "GLOBAL";
    GeographicFocus["CHINA"] = "CHINA";
    GeographicFocus["INDIA"] = "INDIA";
    GeographicFocus["LATIN_AMERICA"] = "LATIN_AMERICA";
})(GeographicFocus || (exports.GeographicFocus = GeographicFocus = {}));
var SectorFocus;
(function (SectorFocus) {
    SectorFocus["TECHNOLOGY"] = "TECHNOLOGY";
    SectorFocus["HEALTHCARE"] = "HEALTHCARE";
    SectorFocus["FINANCIAL_SERVICES"] = "FINANCIAL_SERVICES";
    SectorFocus["ENERGY"] = "ENERGY";
    SectorFocus["INDUSTRIALS"] = "INDUSTRIALS";
    SectorFocus["CONSUMER"] = "CONSUMER";
    SectorFocus["REAL_ESTATE"] = "REAL_ESTATE";
    SectorFocus["INFRASTRUCTURE"] = "INFRASTRUCTURE";
    SectorFocus["DIVERSIFIED"] = "DIVERSIFIED";
})(SectorFocus || (exports.SectorFocus = SectorFocus = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["PRIVATE_PLACEMENT_MEMORANDUM"] = "PRIVATE_PLACEMENT_MEMORANDUM";
    DocumentType["LIMITED_PARTNERSHIP_AGREEMENT"] = "LIMITED_PARTNERSHIP_AGREEMENT";
    DocumentType["SUBSCRIPTION_AGREEMENT"] = "SUBSCRIPTION_AGREEMENT";
    DocumentType["QUARTERLY_REPORT"] = "QUARTERLY_REPORT";
    DocumentType["ANNUAL_REPORT"] = "ANNUAL_REPORT";
    DocumentType["CAPITAL_CALL_NOTICE"] = "CAPITAL_CALL_NOTICE";
    DocumentType["DISTRIBUTION_NOTICE"] = "DISTRIBUTION_NOTICE";
    DocumentType["NAV_STATEMENT"] = "NAV_STATEMENT";
    DocumentType["AUDIT_REPORT"] = "AUDIT_REPORT";
    DocumentType["TAX_DOCUMENT"] = "TAX_DOCUMENT";
    DocumentType["SIDE_LETTER"] = "SIDE_LETTER";
    DocumentType["AMENDMENT"] = "AMENDMENT";
})(DocumentType || (exports.DocumentType = DocumentType = {}));

"use strict";
// Fixed Income Analytics Data Models
// Comprehensive data structures for advanced fixed income analysis
Object.defineProperty(exports, "__esModule", { value: true });
exports.DayCountConvention = exports.PaymentFrequency = exports.CallType = exports.DurationType = exports.YieldType = exports.CreditRating = exports.BondType = void 0;
var BondType;
(function (BondType) {
    BondType["GOVERNMENT"] = "GOVERNMENT";
    BondType["CORPORATE"] = "CORPORATE";
    BondType["MUNICIPAL"] = "MUNICIPAL";
    BondType["TREASURY"] = "TREASURY";
    BondType["AGENCY"] = "AGENCY";
    BondType["SUPRANATIONAL"] = "SUPRANATIONAL";
    BondType["MORTGAGE_BACKED"] = "MORTGAGE_BACKED";
    BondType["ASSET_BACKED"] = "ASSET_BACKED";
    BondType["CONVERTIBLE"] = "CONVERTIBLE";
    BondType["FLOATING_RATE"] = "FLOATING_RATE";
    BondType["ZERO_COUPON"] = "ZERO_COUPON";
})(BondType || (exports.BondType = BondType = {}));
var CreditRating;
(function (CreditRating) {
    CreditRating["AAA"] = "AAA";
    CreditRating["AA_PLUS"] = "AA+";
    CreditRating["AA"] = "AA";
    CreditRating["AA_MINUS"] = "AA-";
    CreditRating["A_PLUS"] = "A+";
    CreditRating["A"] = "A";
    CreditRating["A_MINUS"] = "A-";
    CreditRating["BBB_PLUS"] = "BBB+";
    CreditRating["BBB"] = "BBB";
    CreditRating["BBB_MINUS"] = "BBB-";
    CreditRating["BB_PLUS"] = "BB+";
    CreditRating["BB"] = "BB";
    CreditRating["BB_MINUS"] = "BB-";
    CreditRating["B_PLUS"] = "B+";
    CreditRating["B"] = "B";
    CreditRating["B_MINUS"] = "B-";
    CreditRating["CCC_PLUS"] = "CCC+";
    CreditRating["CCC"] = "CCC";
    CreditRating["CCC_MINUS"] = "CCC-";
    CreditRating["CC"] = "CC";
    CreditRating["C"] = "C";
    CreditRating["D"] = "D";
    CreditRating["NR"] = "NR";
})(CreditRating || (exports.CreditRating = CreditRating = {}));
var YieldType;
(function (YieldType) {
    YieldType["YIELD_TO_MATURITY"] = "YIELD_TO_MATURITY";
    YieldType["YIELD_TO_WORST"] = "YIELD_TO_WORST";
    YieldType["YIELD_TO_CALL"] = "YIELD_TO_CALL";
    YieldType["YIELD_TO_PUT"] = "YIELD_TO_PUT";
    YieldType["CURRENT_YIELD"] = "CURRENT_YIELD";
    YieldType["RUNNING_YIELD"] = "RUNNING_YIELD";
    YieldType["DISCOUNT_YIELD"] = "DISCOUNT_YIELD";
    YieldType["TAX_EQUIVALENT_YIELD"] = "TAX_EQUIVALENT_YIELD";
    YieldType["AFTER_TAX_YIELD"] = "AFTER_TAX_YIELD";
    YieldType["OPTION_ADJUSTED_YIELD"] = "OPTION_ADJUSTED_YIELD";
})(YieldType || (exports.YieldType = YieldType = {}));
var DurationType;
(function (DurationType) {
    DurationType["MODIFIED_DURATION"] = "MODIFIED_DURATION";
    DurationType["MACAULAY_DURATION"] = "MACAULAY_DURATION";
    DurationType["EFFECTIVE_DURATION"] = "EFFECTIVE_DURATION";
    DurationType["KEY_RATE_DURATION"] = "KEY_RATE_DURATION";
    DurationType["OPTION_ADJUSTED_DURATION"] = "OPTION_ADJUSTED_DURATION";
    DurationType["DOLLAR_DURATION"] = "DOLLAR_DURATION";
})(DurationType || (exports.DurationType = DurationType = {}));
var CallType;
(function (CallType) {
    CallType["CALL"] = "CALL";
    CallType["PUT"] = "PUT";
    CallType["SINK"] = "SINK";
    CallType["MAKE_WHOLE"] = "MAKE_WHOLE";
})(CallType || (exports.CallType = CallType = {}));
var PaymentFrequency;
(function (PaymentFrequency) {
    PaymentFrequency["ANNUAL"] = "ANNUAL";
    PaymentFrequency["SEMI_ANNUAL"] = "SEMI_ANNUAL";
    PaymentFrequency["QUARTERLY"] = "QUARTERLY";
    PaymentFrequency["MONTHLY"] = "MONTHLY";
    PaymentFrequency["WEEKLY"] = "WEEKLY";
    PaymentFrequency["DAILY"] = "DAILY";
    PaymentFrequency["ZERO_COUPON"] = "ZERO_COUPON";
    PaymentFrequency["IRREGULAR"] = "IRREGULAR";
})(PaymentFrequency || (exports.PaymentFrequency = PaymentFrequency = {}));
var DayCountConvention;
(function (DayCountConvention) {
    DayCountConvention["THIRTY_360"] = "30/360";
    DayCountConvention["THIRTY_360_ISDA"] = "30/360 ISDA";
    DayCountConvention["THIRTY_E_360"] = "30E/360";
    DayCountConvention["ACT_360"] = "ACT/360";
    DayCountConvention["ACT_365"] = "ACT/365";
    DayCountConvention["ACT_ACT"] = "ACT/ACT";
    DayCountConvention["ACT_ACT_ISDA"] = "ACT/ACT ISDA";
    DayCountConvention["BUS_252"] = "BUS/252";
})(DayCountConvention || (exports.DayCountConvention = DayCountConvention = {}));

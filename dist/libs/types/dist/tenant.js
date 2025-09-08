"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentType = exports.SubscriptionStatus = exports.BillingCycle = void 0;
var BillingCycle;
(function (BillingCycle) {
    BillingCycle["MONTHLY"] = "MONTHLY";
    BillingCycle["QUARTERLY"] = "QUARTERLY";
    BillingCycle["ANNUALLY"] = "ANNUALLY";
})(BillingCycle || (exports.BillingCycle = BillingCycle = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["SUSPENDED"] = "SUSPENDED";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentType["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentType["ACH"] = "ACH";
    PaymentType["WIRE"] = "WIRE";
})(PaymentType || (exports.PaymentType = PaymentType = {}));

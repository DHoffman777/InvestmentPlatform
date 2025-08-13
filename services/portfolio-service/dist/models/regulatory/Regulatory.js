"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegulatoryJurisdiction = exports.FilingStatus = exports.FormType = void 0;
var FormType;
(function (FormType) {
    FormType["FORM_ADV"] = "FORM_ADV";
    FormType["FORM_PF"] = "FORM_PF";
    FormType["FORM_13F"] = "FORM_13F";
    FormType["FORM_N_PORT"] = "FORM_N_PORT";
    FormType["FORM_N_CEN"] = "FORM_N_CEN";
    FormType["FORM_N_Q"] = "FORM_N_Q";
})(FormType || (exports.FormType = FormType = {}));
var FilingStatus;
(function (FilingStatus) {
    FilingStatus["DRAFT"] = "DRAFT";
    FilingStatus["REVIEW"] = "REVIEW";
    FilingStatus["APPROVED"] = "APPROVED";
    FilingStatus["FILED"] = "FILED";
    FilingStatus["REJECTED"] = "REJECTED";
    FilingStatus["AMENDED"] = "AMENDED";
})(FilingStatus || (exports.FilingStatus = FilingStatus = {}));
var RegulatoryJurisdiction;
(function (RegulatoryJurisdiction) {
    RegulatoryJurisdiction["SEC"] = "SEC";
    RegulatoryJurisdiction["FINRA"] = "FINRA";
    RegulatoryJurisdiction["CFTC"] = "CFTC";
    RegulatoryJurisdiction["STATE"] = "STATE";
    RegulatoryJurisdiction["INTERNATIONAL"] = "INTERNATIONAL";
})(RegulatoryJurisdiction || (exports.RegulatoryJurisdiction = RegulatoryJurisdiction = {}));

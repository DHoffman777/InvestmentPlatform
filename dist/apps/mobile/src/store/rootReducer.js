"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const toolkit_1 = require("@reduxjs/toolkit");
const authSlice_1 = __importDefault(require("./slices/authSlice"));
const userSlice_1 = __importDefault(require("./slices/userSlice"));
const portfolioSlice_1 = __importDefault(require("./slices/portfolioSlice"));
const transactionSlice_1 = __importDefault(require("./slices/transactionSlice"));
const alertSlice_1 = __importDefault(require("./slices/alertSlice"));
const documentSlice_1 = __importDefault(require("./slices/documentSlice"));
const messageSlice_1 = __importDefault(require("./slices/messageSlice"));
const settingsSlice_1 = __importDefault(require("./slices/settingsSlice"));
const uiSlice_1 = __importDefault(require("./slices/uiSlice"));
const networkSlice_1 = __importDefault(require("./slices/networkSlice"));
const rootReducer = (0, toolkit_1.combineReducers)({
    auth: authSlice_1.default,
    user: userSlice_1.default,
    portfolio: portfolioSlice_1.default,
    transaction: transactionSlice_1.default,
    alert: alertSlice_1.default,
    document: documentSlice_1.default,
    message: messageSlice_1.default,
    settings: settingsSlice_1.default,
    ui: uiSlice_1.default,
    network: networkSlice_1.default,
});
exports.default = rootReducer;

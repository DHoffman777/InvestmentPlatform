"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearTransactions = exports.addTransaction = exports.setTransactions = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    transactions: [],
    isLoading: false,
    error: null,
};
const transactionSlice = (0, toolkit_1.createSlice)({
    name: 'transaction',
    initialState,
    reducers: {
        setTransactions: (state, action) => {
            state.transactions = action.payload;
        },
        addTransaction: (state, action) => {
            state.transactions.unshift(action.payload);
        },
        clearTransactions: (state) => {
            state.transactions = [];
        },
    },
});
_a = transactionSlice.actions, exports.setTransactions = _a.setTransactions, exports.addTransaction = _a.addTransaction, exports.clearTransactions = _a.clearTransactions;
exports.default = transactionSlice.reducer;

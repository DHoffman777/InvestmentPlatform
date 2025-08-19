"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearDocuments = exports.addDocument = exports.setDocuments = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    documents: [],
    isLoading: false,
    error: null,
};
const documentSlice = (0, toolkit_1.createSlice)({
    name: 'document',
    initialState,
    reducers: {
        setDocuments: (state, action) => {
            state.documents = action.payload;
        },
        addDocument: (state, action) => {
            state.documents.unshift(action.payload);
        },
        clearDocuments: (state) => {
            state.documents = [];
        },
    },
});
_a = documentSlice.actions, exports.setDocuments = _a.setDocuments, exports.addDocument = _a.addDocument, exports.clearDocuments = _a.clearDocuments;
exports.default = documentSlice.reducer;

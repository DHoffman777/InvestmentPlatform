"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearMessages = exports.markAsRead = exports.addMessage = exports.setMessages = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    messages: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
};
const messageSlice = (0, toolkit_1.createSlice)({
    name: 'message',
    initialState,
    reducers: {
        setMessages: (state, action) => {
            state.messages = action.payload;
            state.unreadCount = action.payload.filter(m => !m.isRead).length;
        },
        addMessage: (state, action) => {
            state.messages.unshift(action.payload);
            if (!action.payload.isRead) {
                state.unreadCount += 1;
            }
        },
        markAsRead: (state, action) => {
            const message = state.messages.find(m => m.id === action.payload);
            if (message && !message.isRead) {
                message.isRead = true;
                message.readAt = new Date();
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        clearMessages: (state) => {
            state.messages = [];
            state.unreadCount = 0;
        },
    },
});
_a = messageSlice.actions, exports.setMessages = _a.setMessages, exports.addMessage = _a.addMessage, exports.markAsRead = _a.markAsRead, exports.clearMessages = _a.clearMessages;
exports.default = messageSlice.reducer;

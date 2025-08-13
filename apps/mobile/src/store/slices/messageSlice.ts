import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Message} from '@types/index';

interface MessageState {
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: MessageState = {
  messages: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
      state.unreadCount = action.payload.filter(m => !m.isRead).length;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
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

export const {setMessages, addMessage, markAsRead, clearMessages} = messageSlice.actions;
export default messageSlice.reducer;
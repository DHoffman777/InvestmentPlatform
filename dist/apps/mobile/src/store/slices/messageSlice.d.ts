import { Message } from '@types/index';
interface MessageState {
    messages: Message[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}
export declare const setMessages: import("@reduxjs/toolkit").ActionCreatorWithPayload<Message[], "message/setMessages">, addMessage: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "message/addMessage">, markAsRead: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "message/markAsRead">, clearMessages: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"message/clearMessages">;
declare const _default: import("redux").Reducer<MessageState>;
export default _default;

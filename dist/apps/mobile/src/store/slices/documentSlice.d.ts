import { Document } from '@types/index';
interface DocumentState {
    documents: Document[];
    isLoading: boolean;
    error: string | null;
}
export declare const setDocuments: import("@reduxjs/toolkit").ActionCreatorWithPayload<Document[], "document/setDocuments">, addDocument: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "document/addDocument">, clearDocuments: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"document/clearDocuments">;
declare const _default: import("redux").Reducer<DocumentState>;
export default _default;

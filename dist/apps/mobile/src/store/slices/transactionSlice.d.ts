import { Transaction } from '@types/index';
interface TransactionState {
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;
}
export declare const setTransactions: import("@reduxjs/toolkit").ActionCreatorWithPayload<Transaction[], "transaction/setTransactions">, addTransaction: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "transaction/addTransaction">, clearTransactions: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"transaction/clearTransactions">;
declare const _default: import("redux").Reducer<TransactionState>;
export default _default;

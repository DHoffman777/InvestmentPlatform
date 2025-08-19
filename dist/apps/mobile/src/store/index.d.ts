export declare const store: import("@reduxjs/toolkit").EnhancedStore<any, import("redux").UnknownAction, import("@reduxjs/toolkit").Tuple<[import("redux").StoreEnhancer<{
    dispatch: import("redux-thunk").ThunkDispatch<any, undefined, import("redux").UnknownAction>;
}>, import("redux").StoreEnhancer]>>;
export declare const persistor: any;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

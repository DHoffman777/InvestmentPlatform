interface UIState {
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    activeScreen: string;
    tabBarVisible: boolean;
}
export declare const setLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setLoading">, setRefreshing: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setRefreshing">, setError: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "ui/setError">, setActiveScreen: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/setActiveScreen">, setTabBarVisible: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setTabBarVisible">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/clearError">;
declare const _default: import("redux").Reducer<UIState>;
export default _default;

interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    createdAt: string;
}
interface UIState {
    theme: 'light' | 'dark' | 'auto';
    sidebarOpen: boolean;
    notifications: Notification[];
    loading: {
        global: boolean;
        components: {
            [key: string]: boolean;
        };
    };
    modals: {
        [key: string]: {
            open: boolean;
            data?: any;
        };
    };
    breadcrumbs: Array<{
        label: string;
        href?: string;
    }>;
    pageTitle: string;
    selectedDateRange: {
        startDate: string;
        endDate: string;
        preset: string;
    };
}
export declare const setTheme: import("@reduxjs/toolkit").ActionCreatorWithPayload<"light" | "dark" | "auto", "ui/setTheme">, toggleSidebar: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/toggleSidebar">, setSidebarOpen: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setSidebarOpen">, addNotification: import("@reduxjs/toolkit").ActionCreatorWithPayload<Omit<Notification, "id" | "createdAt">, "ui/addNotification">, removeNotification: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/removeNotification">, clearNotifications: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/clearNotifications">, setGlobalLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setGlobalLoading">, setComponentLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    component: string;
    loading: boolean;
}, "ui/setComponentLoading">, clearComponentLoading: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/clearComponentLoading">, openModal: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    modal: string;
    data?: any;
}, "ui/openModal">, closeModal: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/closeModal">, setBreadcrumbs: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    label: string;
    href?: string;
}[], "ui/setBreadcrumbs">, setPageTitle: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/setPageTitle">, setDateRange: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    startDate: string;
    endDate: string;
    preset: string;
}, "ui/setDateRange">;
declare const _default: import("redux").Reducer<UIState>;
export default _default;

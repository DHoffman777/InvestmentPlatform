"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDateRange = exports.setPageTitle = exports.setBreadcrumbs = exports.closeModal = exports.openModal = exports.clearComponentLoading = exports.setComponentLoading = exports.setGlobalLoading = exports.clearNotifications = exports.removeNotification = exports.addNotification = exports.setSidebarOpen = exports.toggleSidebar = exports.setTheme = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    theme: 'light',
    sidebarOpen: true,
    notifications: [],
    loading: {
        global: false,
        components: {},
    },
    modals: {},
    breadcrumbs: [],
    pageTitle: 'Dashboard',
    selectedDateRange: {
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        preset: 'year_to_date',
    },
};
const uiSlice = (0, toolkit_1.createSlice)({
    name: 'ui',
    initialState,
    reducers: {
        setTheme: (state, action) => {
            state.theme = action.payload;
        },
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen: (state, action) => {
            state.sidebarOpen = action.payload;
        },
        addNotification: (state, action) => {
            const notification = {
                ...action.payload,
                id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date().toISOString(),
            };
            state.notifications.push(notification);
        },
        removeNotification: (state, action) => {
            state.notifications = state.notifications.filter(n => n.id !== action.payload);
        },
        clearNotifications: (state) => {
            state.notifications = [];
        },
        setGlobalLoading: (state, action) => {
            state.loading.global = action.payload;
        },
        setComponentLoading: (state, action) => {
            state.loading.components[action.payload.component] = action.payload.loading;
        },
        clearComponentLoading: (state, action) => {
            delete state.loading.components[action.payload];
        },
        openModal: (state, action) => {
            state.modals[action.payload.modal] = {
                open: true,
                data: action.payload.data,
            };
        },
        closeModal: (state, action) => {
            state.modals[action.payload] = {
                open: false,
                data: undefined,
            };
        },
        setBreadcrumbs: (state, action) => {
            state.breadcrumbs = action.payload;
        },
        setPageTitle: (state, action) => {
            state.pageTitle = action.payload;
        },
        setDateRange: (state, action) => {
            state.selectedDateRange = action.payload;
        },
    },
});
_a = uiSlice.actions, exports.setTheme = _a.setTheme, exports.toggleSidebar = _a.toggleSidebar, exports.setSidebarOpen = _a.setSidebarOpen, exports.addNotification = _a.addNotification, exports.removeNotification = _a.removeNotification, exports.clearNotifications = _a.clearNotifications, exports.setGlobalLoading = _a.setGlobalLoading, exports.setComponentLoading = _a.setComponentLoading, exports.clearComponentLoading = _a.clearComponentLoading, exports.openModal = _a.openModal, exports.closeModal = _a.closeModal, exports.setBreadcrumbs = _a.setBreadcrumbs, exports.setPageTitle = _a.setPageTitle, exports.setDateRange = _a.setDateRange;
exports.default = uiSlice.reducer;

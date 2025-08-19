"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOfflineSync = void 0;
const react_1 = require("react");
const react_redux_1 = require("react-redux");
const offlineService_1 = require("@services/offlineService");
const useOfflineSync = () => {
    const { isOffline } = (0, react_redux_1.useSelector)((state) => state.network);
    const [syncStatus, setSyncStatus] = (0, react_1.useState)({
        isOnline: !isOffline,
        pendingActions: 0,
        isLoading: false,
        lastSync: null,
        cacheStats: {
            totalItems: 0,
            totalSize: 0,
            expiredItems: 0,
        },
    });
    // Update sync status when network changes
    (0, react_1.useEffect)(() => {
        const updateSyncStatus = async () => {
            const pendingActions = await offlineService_1.offlineService.getPendingActionsCount();
            const cacheStats = await offlineService_1.offlineService.getCacheStats();
            setSyncStatus(prev => ({
                ...prev,
                isOnline: !isOffline,
                pendingActions,
                cacheStats,
            }));
        };
        updateSyncStatus();
    }, [isOffline]);
    // Manually trigger sync
    const triggerSync = async () => {
        if (isOffline) {
            console.log('Cannot sync while offline');
            return;
        }
        setSyncStatus(prev => ({ ...prev, isLoading: true }));
        try {
            await offlineService_1.offlineService.syncOfflineActions();
            const pendingActions = await offlineService_1.offlineService.getPendingActionsCount();
            setSyncStatus(prev => ({
                ...prev,
                pendingActions,
                lastSync: new Date(),
                isLoading: false,
            }));
        }
        catch (error) {
            console.error('Sync failed:', error);
            setSyncStatus(prev => ({ ...prev, isLoading: false }));
        }
    };
    // Clear cache
    const clearCache = async () => {
        try {
            await offlineService_1.offlineService.clearCache();
            const cacheStats = await offlineService_1.offlineService.getCacheStats();
            setSyncStatus(prev => ({ ...prev, cacheStats }));
        }
        catch (error) {
            console.error('Failed to clear cache:', error);
        }
    };
    // Clear expired cache entries
    const clearExpiredCache = async () => {
        try {
            await offlineService_1.offlineService.clearExpiredCache();
            const cacheStats = await offlineService_1.offlineService.getCacheStats();
            setSyncStatus(prev => ({ ...prev, cacheStats }));
        }
        catch (error) {
            console.error('Failed to clear expired cache:', error);
        }
    };
    return {
        syncStatus,
        triggerSync,
        clearCache,
        clearExpiredCache,
    };
};
exports.useOfflineSync = useOfflineSync;

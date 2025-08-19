interface OfflineSyncStatus {
    isOnline: boolean;
    pendingActions: number;
    isLoading: boolean;
    lastSync: Date | null;
    cacheStats: {
        totalItems: number;
        totalSize: number;
        expiredItems: number;
    };
}
export declare const useOfflineSync: () => {
    syncStatus: OfflineSyncStatus;
    triggerSync: () => Promise<void>;
    clearCache: () => Promise<void>;
    clearExpiredCache: () => Promise<void>;
};
export {};

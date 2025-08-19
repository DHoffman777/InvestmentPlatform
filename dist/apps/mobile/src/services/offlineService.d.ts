declare class OfflineService {
    private static instance;
    private isOnline;
    private syncInProgress;
    private readonly OFFLINE_ACTIONS_KEY;
    private readonly CACHED_DATA_KEY;
    private readonly MAX_RETRY_COUNT;
    private readonly CACHE_TTL;
    private constructor();
    static getInstance(): OfflineService;
    private initializeNetworkListener;
    isDeviceOnline(): boolean;
    queueOfflineAction(endpoint: string, method: 'POST' | 'PUT' | 'DELETE' | 'PATCH', data?: any): Promise<string>;
    private getOfflineActions;
    syncOfflineActions(): Promise<void>;
    private executeOfflineAction;
    cacheData(key: string, data: any, category?: keyof typeof this.CACHE_TTL): Promise<void>;
    getCachedDataByKey(key: string): Promise<any | null>;
    private getCachedData;
    removeCachedData(key: string): Promise<void>;
    clearCache(): Promise<void>;
    clearExpiredCache(): Promise<void>;
    getCacheStats(): Promise<{
        totalItems: number;
        totalSize: number;
        expiredItems: number;
    }>;
    getPendingActionsCount(): Promise<number>;
    private getActionType;
    initialize(): Promise<void>;
}
export declare const offlineService: OfflineService;
export {};

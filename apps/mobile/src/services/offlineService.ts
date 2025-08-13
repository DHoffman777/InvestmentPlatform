import EncryptedStorage from 'react-native-encrypted-storage';
import NetInfo from '@react-native-community/netinfo';
import {store} from '@store/index';
import {setNetworkStatus, setOfflineMode} from '@store/slices/networkSlice';
import {apiClient} from './apiClient';

// Types for offline data management
interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  timestamp: number;
  retryCount: number;
}

interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private readonly OFFLINE_ACTIONS_KEY = 'offline_actions';
  private readonly CACHED_DATA_KEY = 'cached_data';
  private readonly MAX_RETRY_COUNT = 3;
  private readonly CACHE_TTL = {
    portfolio: 5 * 60 * 1000, // 5 minutes
    positions: 3 * 60 * 1000, // 3 minutes
    transactions: 10 * 60 * 1000, // 10 minutes
    marketData: 1 * 60 * 1000, // 1 minute
    userProfile: 30 * 60 * 1000, // 30 minutes
  };

  private constructor() {
    this.initializeNetworkListener();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  // Initialize network state monitoring
  private initializeNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      store.dispatch(setNetworkStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      }));
      
      store.dispatch(setOfflineMode(!this.isOnline));

      // Sync when coming back online
      if (wasOffline && this.isOnline) {
        this.syncOfflineActions();
      }
    });
  }

  // Check if device is online
  public isDeviceOnline(): boolean {
    return this.isOnline;
  }

  // Queue an action for offline execution
  public async queueOfflineAction(
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    data?: any
  ): Promise<string> {
    const action: OfflineAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.getActionType(method),
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const existingActions = await this.getOfflineActions();
    const updatedActions = [...existingActions, action];
    
    await EncryptedStorage.setItem(
      this.OFFLINE_ACTIONS_KEY,
      JSON.stringify(updatedActions)
    );

    return action.id;
  }

  // Get all queued offline actions
  private async getOfflineActions(): Promise<OfflineAction[]> {
    try {
      const actionsJson = await EncryptedStorage.getItem(this.OFFLINE_ACTIONS_KEY);
      return actionsJson ? JSON.parse(actionsJson) : [];
    } catch (error) {
      console.error('Error getting offline actions:', error);
      return [];
    }
  }

  // Sync offline actions when online
  public async syncOfflineActions(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    const actions = await this.getOfflineActions();
    const successfulActions: string[] = [];
    const failedActions: OfflineAction[] = [];

    console.log(`Syncing ${actions.length} offline actions...`);

    for (const action of actions) {
      try {
        await this.executeOfflineAction(action);
        successfulActions.push(action.id);
        console.log(`Successfully synced action: ${action.id}`);
      } catch (error) {
        action.retryCount++;
        if (action.retryCount < this.MAX_RETRY_COUNT) {
          failedActions.push(action);
          console.log(`Retrying action ${action.id} (attempt ${action.retryCount})`);
        } else {
          console.error(`Failed to sync action ${action.id} after ${this.MAX_RETRY_COUNT} attempts`);
        }
      }
    }

    // Update offline actions queue
    await EncryptedStorage.setItem(
      this.OFFLINE_ACTIONS_KEY,
      JSON.stringify(failedActions)
    );

    this.syncInProgress = false;
    console.log(`Sync completed. ${successfulActions.length} successful, ${failedActions.length} pending retry`);
  }

  // Execute a single offline action
  private async executeOfflineAction(action: OfflineAction): Promise<void> {
    const {endpoint, method, data} = action;
    
    switch (method) {
      case 'POST':
        await apiClient.post(endpoint, data);
        break;
      case 'PUT':
        await apiClient.put(endpoint, data);
        break;
      case 'PATCH':
        await apiClient.patch(endpoint, data);
        break;
      case 'DELETE':
        await apiClient.delete(endpoint);
        break;
    }
  }

  // Cache data for offline access
  public async cacheData(key: string, data: any, category: keyof typeof this.CACHE_TTL = 'portfolio'): Promise<void> {
    const cachedItem: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL[category],
    };

    try {
      const existingCache = await this.getCachedData();
      const updatedCache = {
        ...existingCache,
        [key]: cachedItem,
      };

      await EncryptedStorage.setItem(
        this.CACHED_DATA_KEY,
        JSON.stringify(updatedCache)
      );
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  // Get cached data
  public async getCachedDataByKey(key: string): Promise<any | null> {
    try {
      const cache = await this.getCachedData();
      const item = cache[key];

      if (!item) {
        return null;
      }

      // Check if cache is expired
      const isExpired = Date.now() - item.timestamp > item.ttl;
      if (isExpired) {
        await this.removeCachedData(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  // Get all cached data
  private async getCachedData(): Promise<Record<string, CachedData>> {
    try {
      const cacheJson = await EncryptedStorage.getItem(this.CACHED_DATA_KEY);
      return cacheJson ? JSON.parse(cacheJson) : {};
    } catch (error) {
      console.error('Error getting cached data:', error);
      return {};
    }
  }

  // Remove specific cached data
  public async removeCachedData(key: string): Promise<void> {
    try {
      const cache = await this.getCachedData();
      delete cache[key];
      
      await EncryptedStorage.setItem(
        this.CACHED_DATA_KEY,
        JSON.stringify(cache)
      );
    } catch (error) {
      console.error('Error removing cached data:', error);
    }
  }

  // Clear all cached data
  public async clearCache(): Promise<void> {
    try {
      await EncryptedStorage.removeItem(this.CACHED_DATA_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Clear expired cache entries
  public async clearExpiredCache(): Promise<void> {
    try {
      const cache = await this.getCachedData();
      const currentTime = Date.now();
      const validCache: Record<string, CachedData> = {};

      Object.entries(cache).forEach(([key, item]) => {
        const isExpired = currentTime - item.timestamp > item.ttl;
        if (!isExpired) {
          validCache[key] = item;
        }
      });

      await EncryptedStorage.setItem(
        this.CACHED_DATA_KEY,
        JSON.stringify(validCache)
      );
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  // Get cache statistics
  public async getCacheStats(): Promise<{
    totalItems: number;
    totalSize: number;
    expiredItems: number;
  }> {
    try {
      const cache = await this.getCachedData();
      const currentTime = Date.now();
      let totalSize = 0;
      let expiredItems = 0;

      Object.values(cache).forEach(item => {
        totalSize += JSON.stringify(item).length;
        const isExpired = currentTime - item.timestamp > item.ttl;
        if (isExpired) {
          expiredItems++;
        }
      });

      return {
        totalItems: Object.keys(cache).length,
        totalSize,
        expiredItems,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {totalItems: 0, totalSize: 0, expiredItems: 0};
    }
  }

  // Get pending offline actions count
  public async getPendingActionsCount(): Promise<number> {
    const actions = await this.getOfflineActions();
    return actions.length;
  }

  // Helper method to determine action type
  private getActionType(method: string): OfflineAction['type'] {
    switch (method) {
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'UPDATE';
    }
  }

  // Initialize offline service on app start
  public async initialize(): Promise<void> {
    // Clear expired cache on initialization
    await this.clearExpiredCache();
    
    // Get initial network state
    const networkState = await NetInfo.fetch();
    this.isOnline = networkState.isConnected && networkState.isInternetReachable;
    
    store.dispatch(setNetworkStatus({
      isConnected: networkState.isConnected,
      isInternetReachable: networkState.isInternetReachable,
      type: networkState.type,
    }));
    
    store.dispatch(setOfflineMode(!this.isOnline));

    // Sync any pending actions if online
    if (this.isOnline) {
      this.syncOfflineActions();
    }
  }
}

export const offlineService = OfflineService.getInstance();
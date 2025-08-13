import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '@store/index';
import {offlineService} from '@services/offlineService';

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

export const useOfflineSync = () => {
  const {isOffline} = useSelector((state: RootState) => state.network);
  const [syncStatus, setSyncStatus] = useState<OfflineSyncStatus>({
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
  useEffect(() => {
    const updateSyncStatus = async () => {
      const pendingActions = await offlineService.getPendingActionsCount();
      const cacheStats = await offlineService.getCacheStats();
      
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

    setSyncStatus(prev => ({...prev, isLoading: true}));
    
    try {
      await offlineService.syncOfflineActions();
      const pendingActions = await offlineService.getPendingActionsCount();
      
      setSyncStatus(prev => ({
        ...prev,
        pendingActions,
        lastSync: new Date(),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({...prev, isLoading: false}));
    }
  };

  // Clear cache
  const clearCache = async () => {
    try {
      await offlineService.clearCache();
      const cacheStats = await offlineService.getCacheStats();
      setSyncStatus(prev => ({...prev, cacheStats}));
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  // Clear expired cache entries
  const clearExpiredCache = async () => {
    try {
      await offlineService.clearExpiredCache();
      const cacheStats = await offlineService.getCacheStats();
      setSyncStatus(prev => ({...prev, cacheStats}));
    } catch (error) {
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
import { useState, useEffect, useCallback } from 'react';
import {
  isOnline,
  subscribeToNetworkChanges,
  pendingActionsQueue,
  lastSyncTime,
  syncPendingActions,
  PendingAction,
} from '../lib/offline';

export interface UseOfflineReturn {
  isOnline: boolean;
  isOffline: boolean;
  pendingActionsCount: number;
  lastSyncFormatted: string;
  addPendingAction: (action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
  syncNow: () => Promise<{ success: number; failed: number }>;
  refreshStatus: () => Promise<void>;
}

export function useOffline(
  syncHandler?: (action: PendingAction) => Promise<boolean>
): UseOfflineReturn {
  const [online, setOnline] = useState(true);
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const [lastSyncFormatted, setLastSyncFormatted] = useState('Never');

  // Check initial online status
  useEffect(() => {
    const checkStatus = async () => {
      const status = await isOnline();
      setOnline(status);
    };
    checkStatus();
  }, []);

  // Subscribe to network changes
  useEffect(() => {
    const unsubscribe = subscribeToNetworkChanges((connected) => {
      setOnline(connected);
      
      // Auto-sync when coming back online
      if (connected && syncHandler) {
        syncPendingActions(syncHandler);
      }
    });

    return unsubscribe;
  }, [syncHandler]);

  // Load pending actions count
  useEffect(() => {
    const loadPendingCount = async () => {
      const count = await pendingActionsQueue.count();
      setPendingActionsCount(count);
    };
    loadPendingCount();
  }, []);

  // Load last sync time
  useEffect(() => {
    const loadLastSync = async () => {
      const formatted = await lastSyncTime.getFormatted();
      setLastSyncFormatted(formatted);
    };
    loadLastSync();

    // Update every minute
    const interval = setInterval(loadLastSync, 60000);
    return () => clearInterval(interval);
  }, []);

  // Add pending action
  const addPendingAction = useCallback(
    async (action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>) => {
      await pendingActionsQueue.add(action);
      const count = await pendingActionsQueue.count();
      setPendingActionsCount(count);
    },
    []
  );

  // Manual sync
  const syncNow = useCallback(async () => {
    if (!syncHandler) {
      return { success: 0, failed: 0 };
    }

    const result = await syncPendingActions(syncHandler);
    
    // Update counts
    const count = await pendingActionsQueue.count();
    setPendingActionsCount(count);
    
    const formatted = await lastSyncTime.getFormatted();
    setLastSyncFormatted(formatted);

    return result;
  }, [syncHandler]);

  // Refresh status
  const refreshStatus = useCallback(async () => {
    const status = await isOnline();
    setOnline(status);
    
    const count = await pendingActionsQueue.count();
    setPendingActionsCount(count);
    
    const formatted = await lastSyncTime.getFormatted();
    setLastSyncFormatted(formatted);
  }, []);

  return {
    isOnline: online,
    isOffline: !online,
    pendingActionsCount,
    lastSyncFormatted,
    addPendingAction,
    syncNow,
    refreshStatus,
  };
}











import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Cache keys
const CACHE_KEYS = {
  EVENTS: 'cache_events',
  POSTS: 'cache_posts',
  MESSAGES: 'cache_messages',
  PROFILE: 'cache_profile',
  COURSES: 'cache_courses',
  NOTIFICATIONS: 'cache_notifications',
  LAST_SYNC: 'cache_last_sync',
  PENDING_ACTIONS: 'cache_pending_actions',
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  EVENTS: 5 * 60 * 1000, // 5 minutes
  POSTS: 2 * 60 * 1000, // 2 minutes
  MESSAGES: 1 * 60 * 1000, // 1 minute
  PROFILE: 30 * 60 * 1000, // 30 minutes
  COURSES: 60 * 60 * 1000, // 1 hour
  NOTIFICATIONS: 5 * 60 * 1000, // 5 minutes
};

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'event' | 'post' | 'message' | 'reply';
  payload: any;
  timestamp: number;
  retryCount: number;
}

// Check network connectivity
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return true; // Assume online if we can't check
  }
}

// Subscribe to network state changes
export function subscribeToNetworkChanges(
  callback: (isConnected: boolean) => void
): () => void {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    callback(state.isConnected === true && state.isInternetReachable !== false);
  });
  return unsubscribe;
}

// Generic cache setter
export async function setCache<T>(
  key: string,
  data: T,
  expiryMs: number = 5 * 60 * 1000
): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: expiryMs,
    };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

// Generic cache getter
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const isExpired = Date.now() - entry.timestamp > entry.expiry;

    if (isExpired) {
      // Return stale data but mark for refresh
      console.log(`Cache expired for ${key}, returning stale data`);
    }

    return entry.data;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

// Check if cache is valid (not expired)
export async function isCacheValid(key: string): Promise<boolean> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return false;

    const entry = JSON.parse(cached);
    return Date.now() - entry.timestamp <= entry.expiry;
  } catch {
    return false;
  }
}

// Clear specific cache
export async function clearCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// Clear all caches
export async function clearAllCaches(): Promise<void> {
  try {
    const keys = Object.values(CACHE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing all caches:', error);
  }
}

// Events cache
export const eventsCache = {
  set: (events: any[]) => setCache(CACHE_KEYS.EVENTS, events, CACHE_EXPIRY.EVENTS),
  get: () => getCache<any[]>(CACHE_KEYS.EVENTS),
  clear: () => clearCache(CACHE_KEYS.EVENTS),
  isValid: () => isCacheValid(CACHE_KEYS.EVENTS),
};

// Posts cache
export const postsCache = {
  set: (posts: any[]) => setCache(CACHE_KEYS.POSTS, posts, CACHE_EXPIRY.POSTS),
  get: () => getCache<any[]>(CACHE_KEYS.POSTS),
  clear: () => clearCache(CACHE_KEYS.POSTS),
  isValid: () => isCacheValid(CACHE_KEYS.POSTS),
};

// Messages cache
export const messagesCache = {
  set: (messages: any[]) => setCache(CACHE_KEYS.MESSAGES, messages, CACHE_EXPIRY.MESSAGES),
  get: () => getCache<any[]>(CACHE_KEYS.MESSAGES),
  clear: () => clearCache(CACHE_KEYS.MESSAGES),
  isValid: () => isCacheValid(CACHE_KEYS.MESSAGES),
};

// Profile cache
export const profileCache = {
  set: (profile: any) => setCache(CACHE_KEYS.PROFILE, profile, CACHE_EXPIRY.PROFILE),
  get: () => getCache<any>(CACHE_KEYS.PROFILE),
  clear: () => clearCache(CACHE_KEYS.PROFILE),
  isValid: () => isCacheValid(CACHE_KEYS.PROFILE),
};

// Courses cache
export const coursesCache = {
  set: (courses: any[]) => setCache(CACHE_KEYS.COURSES, courses, CACHE_EXPIRY.COURSES),
  get: () => getCache<any[]>(CACHE_KEYS.COURSES),
  clear: () => clearCache(CACHE_KEYS.COURSES),
  isValid: () => isCacheValid(CACHE_KEYS.COURSES),
};

// Notifications cache
export const notificationsCache = {
  set: (notifications: any[]) => setCache(CACHE_KEYS.NOTIFICATIONS, notifications, CACHE_EXPIRY.NOTIFICATIONS),
  get: () => getCache<any[]>(CACHE_KEYS.NOTIFICATIONS),
  clear: () => clearCache(CACHE_KEYS.NOTIFICATIONS),
  isValid: () => isCacheValid(CACHE_KEYS.NOTIFICATIONS),
};

// Pending actions queue (for offline mutations)
export const pendingActionsQueue = {
  // Add action to queue
  add: async (action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> => {
    try {
      const existing = await AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
      const queue: PendingAction[] = existing ? JSON.parse(existing) : [];
      
      const newAction: PendingAction = {
        ...action,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      queue.push(newAction);
      await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding pending action:', error);
    }
  },

  // Get all pending actions
  getAll: async (): Promise<PendingAction[]> => {
    try {
      const existing = await AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      console.error('Error getting pending actions:', error);
      return [];
    }
  },

  // Remove action from queue
  remove: async (actionId: string): Promise<void> => {
    try {
      const existing = await AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
      const queue: PendingAction[] = existing ? JSON.parse(existing) : [];
      const filtered = queue.filter((a) => a.id !== actionId);
      await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing pending action:', error);
    }
  },

  // Update retry count
  incrementRetry: async (actionId: string): Promise<void> => {
    try {
      const existing = await AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
      const queue: PendingAction[] = existing ? JSON.parse(existing) : [];
      const updated = queue.map((a) =>
        a.id === actionId ? { ...a, retryCount: a.retryCount + 1 } : a
      );
      await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error incrementing retry count:', error);
    }
  },

  // Clear all pending actions
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.PENDING_ACTIONS);
    } catch (error) {
      console.error('Error clearing pending actions:', error);
    }
  },

  // Get count of pending actions
  count: async (): Promise<number> => {
    const actions = await pendingActionsQueue.getAll();
    return actions.length;
  },
};

// Last sync timestamp
export const lastSyncTime = {
  set: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.error('Error setting last sync time:', error);
    }
  },

  get: async (): Promise<number | null> => {
    try {
      const timestamp = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  },

  getFormatted: async (): Promise<string> => {
    const timestamp = await lastSyncTime.get();
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  },
};

// Sync pending actions when back online
export async function syncPendingActions(
  syncHandler: (action: PendingAction) => Promise<boolean>
): Promise<{ success: number; failed: number }> {
  const online = await isOnline();
  if (!online) {
    return { success: 0, failed: 0 };
  }

  const actions = await pendingActionsQueue.getAll();
  let success = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      const result = await syncHandler(action);
      if (result) {
        await pendingActionsQueue.remove(action.id);
        success++;
      } else {
        await pendingActionsQueue.incrementRetry(action.id);
        failed++;
      }
    } catch (error) {
      await pendingActionsQueue.incrementRetry(action.id);
      failed++;
    }
  }

  if (success > 0) {
    await lastSyncTime.set();
  }

  return { success, failed };
}

// Get cache size (for debugging/settings)
export async function getCacheSize(): Promise<string> {
  try {
    const keys = Object.values(CACHE_KEYS);
    let totalSize = 0;

    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length * 2; // Approximate bytes (UTF-16)
      }
    }

    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
  } catch {
    return 'Unknown';
  }
}











import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY_PREFIX = 'campus_connect_';

/**
 * Secure storage adapter for React Native
 * Uses expo-secure-store for native platforms
 * Falls back to in-memory storage for web (development)
 */

// In-memory fallback for web
const inMemoryStorage: Record<string, string> = {};

export const storage = {
  /**
   * Get an item from secure storage
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      const fullKey = `${STORAGE_KEY_PREFIX}${key}`;
      
      if (Platform.OS === 'web') {
        // Web fallback - use localStorage in development
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(fullKey);
        }
        return inMemoryStorage[fullKey] || null;
      }
      
      return await SecureStore.getItemAsync(fullKey);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },

  /**
   * Set an item in secure storage
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const fullKey = `${STORAGE_KEY_PREFIX}${key}`;
      
      if (Platform.OS === 'web') {
        // Web fallback
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(fullKey, value);
          return;
        }
        inMemoryStorage[fullKey] = value;
        return;
      }
      
      await SecureStore.setItemAsync(fullKey, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },

  /**
   * Remove an item from secure storage
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      const fullKey = `${STORAGE_KEY_PREFIX}${key}`;
      
      if (Platform.OS === 'web') {
        // Web fallback
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(fullKey);
          return;
        }
        delete inMemoryStorage[fullKey];
        return;
      }
      
      await SecureStore.deleteItemAsync(fullKey);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },

  /**
   * Clear all Campus Connect storage items
   */
  clear: async (): Promise<void> => {
    // Note: SecureStore doesn't have a clear method
    // We need to manually remove known keys
    const keys = ['auth_token', 'refresh_token', 'user_id', 'biometric_enabled'];
    await Promise.all(keys.map(key => storage.removeItem(key)));
  },
};

/**
 * Supabase storage adapter for auth persistence
 * Implements the storage interface expected by Supabase
 */
export const supabaseStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return storage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await storage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await storage.removeItem(key);
  },
};

/**
 * Biometric authentication storage helpers
 */
export const biometricStorage = {
  /**
   * Check if biometric login is enabled
   */
  isEnabled: async (): Promise<boolean> => {
    const value = await storage.getItem('biometric_enabled');
    return value === 'true';
  },

  /**
   * Enable biometric login
   */
  enable: async (): Promise<void> => {
    await storage.setItem('biometric_enabled', 'true');
  },

  /**
   * Disable biometric login
   */
  disable: async (): Promise<void> => {
    await storage.setItem('biometric_enabled', 'false');
  },
};

export default storage;











import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import {
  registerForPushNotificationsAsync,
  savePushTokenToSupabase,
  removePushTokenFromSupabase,
  getNotificationHistory,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAllNotifications,
  getNotificationRoute,
  NotificationData,
} from '../lib/notifications';

export interface StoredNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  target_id?: string;
  target_screen?: string;
  read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: StoredNotification[];
  unreadCount: number;
  loading: boolean;
  pushToken: string | null;
  hasPermission: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  clearPushToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Register for push notifications (native only)
  const registerPushNotifications = useCallback(async () => {
    if (!user?.id || Platform.OS === 'web') return;

    try {
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        setPushToken(token);
        setHasPermission(true);
        await savePushTokenToSupabase(user.id, token);
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.log('Push notification registration skipped:', error);
    }
  }, [user?.id]);

  // Fetch notification history
  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [history, count] = await Promise.all([
        getNotificationHistory(user.id),
        getUnreadNotificationCount(user.id),
      ]);

      setNotifications(history);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const success = await markNotificationAsRead(notificationId);
    
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    const success = await markAllNotificationsAsRead(user.id);
    
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    }
  }, [user?.id]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    if (!user?.id) return;

    const success = await deleteAllNotifications(user.id);
    
    if (success) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.id]);

  // Clear push token (on logout)
  const clearPushToken = useCallback(async () => {
    if (!user?.id) return;

    await removePushTokenFromSupabase(user.id);
    setPushToken(null);
  }, [user?.id]);

  // Handle notification tap - navigate to appropriate screen
  const handleNotificationResponse = useCallback(
    (response: any) => {
      const data = response?.notification?.request?.content?.data as NotificationData;
      
      if (data) {
        const route = getNotificationRoute(data);
        router.push(route as any);
      }
    },
    []
  );

  // Handle incoming notification while app is in foreground
  const handleIncomingNotification = useCallback(
    () => {
      // Refresh notifications list when a new one arrives
      refreshNotifications();
    },
    [refreshNotifications]
  );

  // Set up notification listeners (native only)
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return;

    // Register for push notifications
    registerPushNotifications();

    // Dynamically import expo-notifications only on native
    const setupListeners = async () => {
      try {
        const Notifications = require('expo-notifications');
        
        // Listen for incoming notifications
        notificationListener.current = Notifications.addNotificationReceivedListener(
          handleIncomingNotification
        );

        // Listen for notification taps
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
          handleNotificationResponse
        );
      } catch (error) {
        console.log('Notifications not available:', error);
      }
    };

    setupListeners();

    return () => {
      if (Platform.OS !== 'web') {
        try {
          const Notifications = require('expo-notifications');
          if (notificationListener.current) {
            Notifications.removeNotificationSubscription(notificationListener.current);
          }
          if (responseListener.current) {
            Notifications.removeNotificationSubscription(responseListener.current);
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isAuthenticated, registerPushNotifications, handleIncomingNotification, handleNotificationResponse]);

  // Fetch notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPushToken(null);
    }
  }, [isAuthenticated, refreshNotifications]);

  // Real-time subscription for notifications
  useEffect(() => {
    if (!user?.id || !isAuthenticated) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // New notification created - refresh the list
          console.log('New notification received:', payload.new);
          await refreshNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Notification updated (e.g., marked as read) - refresh the list
          console.log('Notification updated:', payload.new);
          await refreshNotifications();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to notifications real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to notifications real-time updates');
        }
      });

    return () => {
      console.log('Cleaning up notifications real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAuthenticated, refreshNotifications]);

  // Check for notification that opened the app (native only)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const checkInitialNotification = async () => {
      try {
        const Notifications = require('expo-notifications');
        const response = await Notifications.getLastNotificationResponseAsync();
        
        if (response) {
          handleNotificationResponse(response);
        }
      } catch (error) {
        console.log('Initial notification check skipped:', error);
      }
    };

    checkInitialNotification();
  }, [handleNotificationResponse]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        pushToken,
        hasPermission,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        clearPushToken,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}

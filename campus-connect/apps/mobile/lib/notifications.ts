import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { storage } from './storage';

// Only import notifications on native platforms
let Notifications: any = null;
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');

  // Configure notification handling
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export interface NotificationData {
  type: 'event' | 'message' | 'community' | 'academic' | 'general';
  targetId?: string;
  targetScreen?: string;
  title: string;
  body: string;
}

// Register for push notifications and get the token
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Check if notifications module is available
  if (!Notifications || Platform.OS === 'web') {
    console.log('Push notifications are not supported on this platform');
    return null;
  }

  // Check and request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission for push notifications was denied');
    return null;
  }

  // Get the Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    token = tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });

    // Create separate channels for different notification types
    await Notifications.setNotificationChannelAsync('events', {
      name: 'Events',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Notifications about campus events',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.MAX,
      description: 'Direct message notifications',
    });

    await Notifications.setNotificationChannelAsync('academics', {
      name: 'Academics',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Academic updates and reminders',
    });

    await Notifications.setNotificationChannelAsync('community', {
      name: 'Community',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Community posts and replies',
    });
  }

  return token;
}

// Save push token to Supabase
export async function savePushTokenToSupabase(userId: string, token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) {
      console.error('Error saving push token:', error);
      return false;
    }

    // Also save locally for quick access
    await storage.setItem('push_token', token);
    return true;
  } catch (error) {
    console.error('Error saving push token:', error);
    return false;
  }
}

// Remove push token from Supabase (on logout)
export async function removePushTokenFromSupabase(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: null })
      .eq('id', userId);

    if (error) {
      console.error('Error removing push token:', error);
      return false;
    }

    await storage.removeItem('push_token');
    return true;
  } catch (error) {
    console.error('Error removing push token:', error);
    return false;
  }
}

// Schedule a local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
  trigger?: any
): Promise<string> {
  if (!Notifications || Platform.OS === 'web') {
    console.log('Local notifications not available on web');
    return '';
  }
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data as unknown as Record<string, unknown>,
      sound: true,
    },
    trigger: trigger || null, // null = immediate
  });
}

// Schedule a reminder notification
export async function scheduleReminderNotification(
  title: string,
  body: string,
  date: Date,
  data?: NotificationData
): Promise<string> {
  if (!Notifications || Platform.OS === 'web') {
    console.log('Reminder notifications not available on web');
    return '';
  }
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data as unknown as Record<string, unknown>,
      sound: true,
    },
    trigger: {
      date,
    },
  });
}

// Cancel a scheduled notification
export async function cancelNotification(notificationId: string): Promise<void> {
  if (!Notifications || Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  if (!Notifications || Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get all pending/scheduled notifications
export async function getPendingNotifications() {
  if (!Notifications || Platform.OS === 'web') return [];
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Get notification history from Supabase
export async function getNotificationHistory(userId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    // Map database fields to application model
    // The database has 'message' but the app expects 'body'
    // Also map action_url for navigation
    const mappedData = (data || []).map((n: any) => ({
      ...n,
      body: n.body || n.message, // Fallback to message if body is missing
      action_url: n.action_url, // Preserve action_url for navigation
      // Extract target_id from action_url if needed
      target_id: n.target_id || (n.action_url ? extractIdFromActionUrl(n.action_url) : undefined),
    }));

    return mappedData;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    return !error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    return !error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    return !error;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

// Delete all notifications for a user
export async function deleteAllNotifications(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return false;
  }
}

// Helper function to extract ID from action_url
function extractIdFromActionUrl(actionUrl: string | undefined): string | undefined {
  if (!actionUrl) return undefined;
  
  // Extract ID from paths like /profile/{id}, /(tabs)/messages/{id}, etc.
  const match = actionUrl.match(/\/([^\/]+)$/);
  return match ? match[1] : undefined;
}

// Get the route to navigate to based on notification data
export function getNotificationRoute(data: NotificationData): string {
  // If targetScreen (action_url) is provided, use it directly
  if (data.targetScreen && data.targetScreen.startsWith('/')) {
    return data.targetScreen;
  }
  
  // Otherwise, construct route from type and targetId
  switch (data.type) {
    case 'event':
      // Check if notification title indicates event chat
      if (data.title === 'New Event Chat Message') {
        // Extract event ID from action_url or use targetId
        const eventId = data.targetId || extractIdFromActionUrl(data.targetScreen);
        return eventId ? `/(tabs)/events/${eventId}?tab=chat` : '/(tabs)/events';
      }
      return data.targetId ? `/(tabs)/events/${data.targetId}` : '/(tabs)/events';
    case 'message':
    case 'social': // Friend requests and messages are 'social' type
      // Check if it's a message notification
      if (data.title === 'New Message') {
        return data.targetId ? `/(tabs)/messages/${data.targetId}` : '/(tabs)/messages';
      }
      // Friend request notifications - navigate to requests tab
      if (data.title === 'New Friend Request' || data.title === 'Friend Request Accepted') {
        return '/(tabs)/friends?tab=requests';
      }
      // Post like/comment notifications
      if (data.title === 'Post Liked' || data.title === 'New Comment') {
        return data.targetId ? `/(tabs)/community/${data.targetId}` : '/(tabs)/community';
      }
      return data.targetId ? `/(tabs)/messages/${data.targetId}` : '/(tabs)/messages';
    case 'community':
      return data.targetId ? `/(tabs)/community/${data.targetId}` : '/(tabs)/community';
    case 'academic':
      return '/academics';
    default:
      return data.targetScreen || '/(tabs)/home';
  }
}

// Send a test notification (for development)
export async function sendTestNotification(): Promise<void> {
  await scheduleLocalNotification(
    'Test Notification',
    'This is a test notification from Campus Connect!',
    {
      type: 'general',
      title: 'Test Notification',
      body: 'This is a test notification from Campus Connect!',
    }
  );
}


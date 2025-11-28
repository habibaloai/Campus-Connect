import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Bell, CheckCheck, ChevronLeft, Calendar, MessageCircle, Users, BookOpen, Info } from 'lucide-react-native';
import { useNotifications, StoredNotification } from '../../contexts/NotificationContext';
import { getNotificationRoute, NotificationData } from '../../lib/notifications';

const NotificationIcon = ({ type }: { type: string }) => {
  const iconProps = { size: 20, color: '#6B7280' };
  
  switch (type) {
    case 'event':
      return <Calendar {...iconProps} color="#3B82F6" />;
    case 'message':
      return <MessageCircle {...iconProps} color="#10B981" />;
    case 'community':
      return <Users {...iconProps} color="#8B5CF6" />;
    case 'academic':
      return <BookOpen {...iconProps} color="#F59E0B" />;
    default:
      return <Info {...iconProps} />;
  }
};

const NotificationItem = ({
  notification,
  onPress,
}: {
  notification: StoredNotification;
  onPress: () => void;
}) => {
  const timeAgo = getTimeAgo(notification.created_at);

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-start p-4 border-b border-gray-100 ${
        !notification.read ? 'bg-blue-50' : 'bg-white'
      }`}
      activeOpacity={0.7}
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
          !notification.read ? 'bg-blue-100' : 'bg-gray-100'
        }`}
      >
        <NotificationIcon type={notification.type} />
      </View>
      
      <View className="flex-1">
        <Text
          className={`text-base ${
            !notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
          }`}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
          {notification.body}
        </Text>
        <Text className="text-xs text-gray-400 mt-2">{timeAgo}</Text>
      </View>

      {!notification.read && (
        <View className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
      )}
    </TouchableOpacity>
  );
};

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleNotificationPress = useCallback(
    async (notification: StoredNotification) => {
      // Mark as read
      if (!notification.read) {
        await markAsRead(notification.id);
      }

      // Navigate to target screen
      const data: NotificationData = {
        type: notification.type as any,
        targetId: notification.target_id,
        targetScreen: notification.target_screen,
        title: notification.title,
        body: notification.body,
      };
      
      const route = getNotificationRoute(data);
      router.push(route as any);
    },
    [markAsRead]
  );

  const groupedNotifications = React.useMemo(() => {
    const today: StoredNotification[] = [];
    const yesterday: StoredNotification[] = [];
    const older: StoredNotification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

    notifications.forEach((notification) => {
      const date = new Date(notification.created_at);
      
      if (date >= todayStart) {
        today.push(notification);
      } else if (date >= yesterdayStart) {
        yesterday.push(notification);
      } else {
        older.push(notification);
      }
    });

    return { today, yesterday, older };
  }, [notifications]);

  const renderSection = (title: string, items: StoredNotification[]) => {
    if (items.length === 0) return null;

    return (
      <View className="mb-4">
        <Text className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
          {title}
        </Text>
        {items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onPress={() => handleNotificationPress(notification)}
          />
        ))}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ChevronLeft size={24} color="#374151" />
            </TouchableOpacity>
          ),
          headerRight: () =>
            unreadCount > 0 ? (
              <TouchableOpacity onPress={markAllAsRead} className="p-2 flex-row items-center">
                <CheckCheck size={20} color="#3B82F6" />
                <Text className="text-blue-500 ml-1 text-sm font-medium">Mark all read</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />

      {loading && notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-4">Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Bell size={40} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-semibold text-gray-700 text-center">
            No Notifications
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            When you get notifications, they'll show up here
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshNotifications}
              colors={['#3B82F6']}
            />
          }
        >
          {renderSection('Today', groupedNotifications.today)}
          {renderSection('Yesterday', groupedNotifications.yesterday)}
          {renderSection('Older', groupedNotifications.older)}
          
          <View className="h-8" />
        </ScrollView>
      )}
    </View>
  );
}










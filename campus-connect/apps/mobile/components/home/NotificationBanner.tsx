import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Bell, ChevronRight, Calendar, MessageCircle, Users, BookOpen, Info } from 'lucide-react-native';
import { useNotifications, StoredNotification } from '../../contexts/NotificationContext';

const NotificationIcon = ({ type, size = 16 }: { type: string; size?: number }) => {
  const iconProps = { size, color: '#FFFFFF' };
  
  switch (type) {
    case 'event':
      return <Calendar {...iconProps} />;
    case 'message':
      return <MessageCircle {...iconProps} />;
    case 'community':
      return <Users {...iconProps} />;
    case 'academic':
      return <BookOpen {...iconProps} />;
    default:
      return <Info {...iconProps} />;
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'event':
      return 'bg-blue-500';
    case 'message':
      return 'bg-green-500';
    case 'community':
      return 'bg-purple-500';
    case 'academic':
      return 'bg-amber-500';
    default:
      return 'bg-gray-500';
  }
};

interface NotificationBannerProps {
  maxItems?: number;
}

export default function NotificationBanner({ maxItems = 3 }: NotificationBannerProps) {
  const { notifications, unreadCount } = useNotifications();

  const unreadNotifications = notifications
    .filter((n) => !n.read)
    .slice(0, maxItems);

  if (unreadNotifications.length === 0) {
    return null;
  }

  const handlePress = () => {
    router.push('/notifications');
  };

  return (
    <View className="mx-4 mb-4">
      <TouchableOpacity
        onPress={handlePress}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        activeOpacity={0.7}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center mr-2">
              <Bell size={16} color="#EF4444" />
            </View>
            <Text className="font-semibold text-gray-800">
              {unreadCount} New Notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-blue-500 text-sm mr-1">View All</Text>
            <ChevronRight size={16} color="#3B82F6" />
          </View>
        </View>

        {/* Notification Items */}
        {unreadNotifications.map((notification, index) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            isLast={index === unreadNotifications.length - 1}
          />
        ))}
      </TouchableOpacity>
    </View>
  );
}

const NotificationItem = ({
  notification,
  isLast,
}: {
  notification: StoredNotification;
  isLast: boolean;
}) => {
  const timeAgo = getTimeAgo(notification.created_at);

  return (
    <View
      className={`flex-row items-center px-4 py-3 ${
        !isLast ? 'border-b border-gray-50' : ''
      }`}
    >
      <View
        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${getTypeColor(
          notification.type
        )}`}
      >
        <NotificationIcon type={notification.type} />
      </View>
      <View className="flex-1">
        <Text className="font-medium text-gray-800" numberOfLines={1}>
          {notification.title}
        </Text>
        <Text className="text-sm text-gray-500" numberOfLines={1}>
          {notification.body}
        </Text>
      </View>
      <Text className="text-xs text-gray-400">{timeAgo}</Text>
    </View>
  );
};

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}










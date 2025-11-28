import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LucideIcon, Inbox, Search, Calendar, Users, MessageCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'default' | 'search' | 'events' | 'community' | 'messages';
}

const iconMap: Record<string, LucideIcon> = {
  default: Inbox,
  search: Search,
  events: Calendar,
  community: Users,
  messages: MessageCircle,
};

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  type = 'default',
}: EmptyStateProps) {
  const IconComponent = icon || iconMap[type] || Inbox;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="flex-1 items-center justify-center px-8 py-12"
    >
      <Animated.View
        entering={FadeInUp.duration(400).delay(100)}
        className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-6"
      >
        <IconComponent size={40} color="#9CA3AF" />
      </Animated.View>

      <Animated.Text
        entering={FadeInUp.duration(400).delay(200)}
        className="text-xl font-semibold text-gray-700 text-center mb-2"
      >
        {title}
      </Animated.Text>

      {description && (
        <Animated.Text
          entering={FadeInUp.duration(400).delay(300)}
          className="text-base text-gray-500 text-center max-w-xs"
        >
          {description}
        </Animated.Text>
      )}

      {actionLabel && onAction && (
        <Animated.View entering={FadeInUp.duration(400).delay(400)}>
          <TouchableOpacity
            onPress={onAction}
            className="mt-6 bg-blue-500 px-6 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">{actionLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}











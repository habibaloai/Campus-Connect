import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageCircle, Heart, Eye, User } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { DesignSystem } from '@/constants/design';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ActivityCardProps {
  userName: string;
  timeAgo: string;
  avatarUrl?: string;
  views?: number;
  comments?: number;
  likes?: number;
  onPress?: () => void;
  index?: number;
}

export default function ActivityCard({
  userName,
  timeAgo,
  avatarUrl,
  views,
  comments,
  likes,
  onPress,
  index = 0,
}: ActivityCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 50).springify()}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: 4,
          },
        ]}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <User size={20} color={DesignSystem.colors.primary} />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: isDark ? '#ffffff' : '#1e293b' }]}>{userName}</Text>
            <Text style={[styles.timeAgo, { color: isDark ? '#94a3b8' : '#64748b' }]}>{timeAgo}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          {views !== undefined && (
            <View style={styles.statItem}>
              <Eye size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={[styles.statText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{views}</Text>
            </View>
          )}
          {comments !== undefined && (
            <View style={styles.statItem}>
              <MessageCircle size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={[styles.statText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{comments}</Text>
            </View>
          )}
          {likes !== undefined && (
            <View style={styles.statItem}>
              <Heart size={16} color={DesignSystem.colors.primary} fill={DesignSystem.colors.primary} />
              <Text style={[styles.statText, { color: DesignSystem.colors.primary }]}>{likes}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#e6f2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },
});


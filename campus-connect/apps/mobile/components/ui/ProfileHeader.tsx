import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DesignSystem } from '@/constants/design';
import { User, Edit2 } from 'lucide-react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface ProfileHeaderProps {
  username: string;
  name: string;
  location?: string;
  avatarUrl?: string;
  friendsCount?: number;
  showFollowButton?: boolean;
  onFollowPress?: () => void;
}

export default function ProfileHeader({
  username,
  name,
  location,
  avatarUrl,
  friendsCount = 0,
  showFollowButton = false,
  onFollowPress,
}: ProfileHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.container}>
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={isDark
            ? ['rgba(0, 102, 204, 0.25)', 'rgba(0, 102, 204, 0.15)']
            : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          {/* Profile icon button in top right */}
          <View style={styles.profileIconButton}>
            <TouchableOpacity
              onPress={() => router.push('/profile/edit')}
              style={[
                styles.editButton,
                { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 102, 204, 0.1)' }
              ]}
              activeOpacity={0.7}
            >
              <Edit2 size={18} color={isDark ? "#ffffff" : "#0066cc"} />
            </TouchableOpacity>
          </View>
          
          {/* Profile Content */}
          <View style={styles.profileContent}>
            {/* Profile Picture */}
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{name[0]?.toUpperCase() || 'U'}</Text>
                </View>
              )}
            </View>

            {/* Username */}
            <Text style={[styles.username, { color: isDark ? '#ffffff' : '#1e293b' }]}>@{username}</Text>

            {/* Name */}
            <Text style={[styles.name, { color: isDark ? '#ffffff' : '#1e293b' }]}>{name}</Text>

            {/* Location */}
            {location && <Text style={[styles.location, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#64748b' }]}>{location}</Text>}

            {/* Friends Count */}
            <TouchableOpacity
              style={styles.statsBar}
              onPress={() => router.push('/friends' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: isDark ? '#ffffff' : '#1e293b' }]}>{friendsCount}</Text>
                <Text style={[styles.statLabel, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#64748b' }]}>Friends</Text>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Animated.View >
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientCard: {
    width: '100%',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  profileIconButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContent: {
    width: '100%',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  avatarPlaceholder: {
    backgroundColor: '#e6f2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: DesignSystem.colors.primary,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 20,
  },
});


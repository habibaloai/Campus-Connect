import React from 'react';
import { View, Text, Image, ImageBackground, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DesignSystem } from '@/constants/design';
import { User } from 'lucide-react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface ProfileHeaderProps {
  username: string;
  name: string;
  location?: string;
  avatarUrl?: string;
  followers?: number;
  following?: number;
  showFollowButton?: boolean;
  onFollowPress?: () => void;
}

export default function ProfileHeader({
  username,
  name,
  location,
  avatarUrl,
  followers = 0,
  following = 0,
  showFollowButton = false,
  onFollowPress,
}: ProfileHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Use splash screen image as background
  const backgroundSource = require('../../assets/images/splash-screen.png');

  return (
    <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.container}>
      {/* Background Image with Curved White Overlay */}
      <View style={styles.headerContainer}>
        <ImageBackground
          source={backgroundSource}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {/* Dark gradient overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
            style={StyleSheet.absoluteFillObject}
          />
          
          {/* Profile icon button in top right */}
          <View style={styles.profileIconButton}>
            <TouchableOpacity
              onPress={() => router.push('/profile/edit')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <User size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          {/* Curved black section overlay */}
          <View style={styles.curvedOverlay}>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
              style={styles.curvedGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            
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
              <Text style={styles.username}>@{username}</Text>

              {/* Location */}
              {location && <Text style={styles.location}>{location}</Text>}

              {/* Followers/Following Bar */}
              <View style={styles.statsBar}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{followers}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{following}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>

            </View>
          </View>
        </ImageBackground>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
  },
  headerContainer: {
    width: width,
    height: 320,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  profileIconButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  curvedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  curvedGradient: {
    flex: 1,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  profileContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  avatarContainer: {
    marginTop: -70,
    marginBottom: 8,
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
    color: '#ffffff',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 12,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 40,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#e2e8f0',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  socialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
});


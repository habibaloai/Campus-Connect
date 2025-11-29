import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Switch, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ProfileHeader from '@/components/ui/ProfileHeader';
import {
  User,
  Mail,
  GraduationCap,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Fingerprint,
  BookOpen,
  Utensils,
  Navigation,
  Bot,
  Heart,
  Trophy,
  Settings,
  Users,
  UserPlus,
  MapPin,
  Flame,
  TrendingUp,
  Target,
  UserCheck,
  Hash,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/providers';
import { api } from '@/lib/supabase';
import { useColorScheme } from '@/components/useColorScheme';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, profile, signOut, biometricAvailable, biometricEnabled, enableBiometric, disableBiometric, refreshProfile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [animationKey, setAnimationKey] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);

  // Track last focus time to prevent rapid re-animations
  const lastFocusTimeRef = React.useRef<number>(0);

  const fetchProfileData = async () => {
    if (!user?.id) return;
    try {
      // Fetch friends count
      const { data: friends } = await api.getFriends(user.id);
      setFriendsCount(friends?.length || 0);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  // Refresh profile and reset animations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Only animate if it's been at least 500ms since last animation
      // This prevents infinite loops while still allowing animations on tab switches
      if (now - lastFocusTimeRef.current > 500) {
        setAnimationKey((prev) => prev + 1);
        lastFocusTimeRef.current = now;
      }

      if (user?.id) {
        console.log('[Profile Screen] Screen focused, refreshing profile...');
        // Call refreshProfile without including it in dependencies to prevent infinite loops
        refreshProfile();
        fetchProfileData();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]) // Only depend on user?.id, not refreshProfile
  );

  const quickLinks = [
    { icon: BookOpen, label: 'Academics', route: '/academics', color: '#0066cc', bgColor: '#e6f2ff' },
    { icon: Utensils, label: 'Dining', route: '/dining', color: '#f59e0b', bgColor: '#fef3c7' },
    { icon: Navigation, label: 'Navigate', route: '/transport', color: '#6366f1', bgColor: '#e0e7ff' },
    { icon: Bot, label: 'AI Assistant', route: '/ai', color: '#8b5cf6', bgColor: '#ede9fe' },
    { icon: Heart, label: 'Wellness', route: '/wellness', color: '#ec4899', bgColor: '#fce7f3' },
    { icon: Trophy, label: 'Achievements', route: '/achievements', color: '#f59e0b', bgColor: '#fef3c7' },
  ];

  const gamificationLinks = [
    { icon: Flame, label: 'Streaks', route: '/streaks', color: '#f59e0b', bgColor: '#fef3c7' },
    { icon: TrendingUp, label: 'Leaderboard', route: '/leaderboards', color: '#0066cc', bgColor: '#e6f2ff' },
    { icon: Target, label: 'Challenges', route: '/challenges', color: '#10b981', bgColor: '#d1fae5' },
  ];

  const menuItems = [
    {
      title: 'Account',
      items: [
        { icon: Bell, label: 'Notifications', onPress: () => router.push('/notifications') },
        { icon: Settings, label: 'Preferences', onPress: () => { } },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: Shield, label: 'Change Password', onPress: () => { } },
        ...(biometricAvailable
          ? [
            {
              icon: Fingerprint,
              label: 'Biometric Login',
              isToggle: true,
              value: biometricEnabled,
              onToggle: biometricEnabled ? disableBiometric : enableBiometric,
            },
          ]
          : []),
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & FAQ', onPress: () => { } },
        { icon: Mail, label: 'Contact Us', onPress: () => { } },
      ],
    },
  ];

  // Use splash screen image as background (same as login page)
  const backgroundSource = require('@/assets/images/splash-screen.png');

  return (
    <ImageBackground
      source={backgroundSource}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Blurred Background Overlay */}
      <View style={[styles.blurOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)' }]} />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={isDark
          ? ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']
          : ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.05)']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Bottom gradient */}
      <LinearGradient
        colors={isDark
          ? ['rgba(17,17,16,0)', 'rgba(17,17,16,1)', 'rgba(17,17,16,1)']
          : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.4)']}
        locations={[0, 0.4424, 1]}
        style={styles.bottomGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Profile Header with Background Image */}
          <Animated.View
            key={`profile-header-${animationKey}`}
            entering={FadeInDown.duration(500).springify()}
          >
            <ProfileHeader
              username={profile?.nickname || user?.email?.split('@')[0] || 'student'}
              name={profile?.name || 'Student'}
              location={profile?.major ? `${profile.major}${profile.year ? ` • ${profile.year}` : ''}` : undefined}
              avatarUrl={profile?.avatar_url}
              friendsCount={friendsCount}
            />
          </Animated.View>

          {/* Bio/Description Section */}
          <Animated.View
            key={`bio-section-${animationKey}`}
            entering={FadeInDown.duration(500).delay(100).springify()}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              marginTop: 8,
              marginHorizontal: 20,
              borderRadius: 16,
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 14, lineHeight: 20, color: isDark ? '#e2e8f0' : '#475569' }}>
              {profile?.bio || 'No bio yet. Add a description in your profile settings.'}
            </Text>
          </Animated.View>

          {/* Scrollable Interests, Hobbies, and Descriptions */}
          <Animated.View
            key={`interests-section-${animationKey}`}
            entering={FadeInDown.duration(500).delay(150).springify()}
            style={{
              marginTop: 12,
              marginHorizontal: 20,
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}
            >
              {profile?.favorite_lecture && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <BookOpen size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      marginLeft: 8,
                      color: isDark ? '#e2e8f0' : '#475569',
                    }}
                  >
                    {profile.favorite_lecture}
                  </Text>
                </View>
              )}

              {profile?.interests && profile.interests.length > 0 && profile.interests.map((interest, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Hash size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      marginLeft: 6,
                      color: isDark ? '#e2e8f0' : '#475569',
                    }}
                  >
                    {interest}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Quick Links Section */}
          <Animated.View
            key={`quick-links-${animationKey}`}
            entering={FadeInDown.duration(500).delay(200).springify()}
            style={{ paddingHorizontal: 20, marginTop: 24 }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 16, color: isDark ? '#ffffff' : '#1e293b' }}>
              Quick Links
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {quickLinks.map((link, index) => (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => router.push(link.route as any)}
                  style={{
                    width: (width - 52) / 2,
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.06,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: link.bgColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <link.icon size={20} color={link.color} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: isDark ? '#ffffff' : '#1e293b' }}>
                    {link.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Gamification Section */}
          <Animated.View
            key={`gamification-${animationKey}`}
            entering={FadeInDown.duration(500).delay(300).springify()}
            style={{ paddingHorizontal: 20, marginTop: 24 }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 16, color: isDark ? '#ffffff' : '#1e293b' }}>
              Gamification
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {gamificationLinks.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => router.push(link.route as any)}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.06,
                    shadowRadius: 6,
                    elevation: 3,
                    alignItems: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: link.bgColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <link.icon size={20} color={link.color} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: isDark ? '#ffffff' : '#1e293b', textAlign: 'center' }}>
                    {link.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Menu Sections */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
            {menuItems.map((section, sectionIndex) => (
              <Animated.View
                key={`${section.title}-${animationKey}`}
                entering={FadeInDown.duration(400).delay(200 + 80 * sectionIndex).springify()}
                className="mb-5"
              >
                <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {section.title}
                </Text>
                <View
                  style={{
                    borderRadius: 24,
                    overflow: 'hidden',
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.3 : 0.15,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                >
                  {section.items.map((item: any, itemIndex) => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={item.isToggle ? undefined : item.onPress}
                      className={`flex-row items-center justify-between px-4 py-3.5 ${itemIndex !== section.items.length - 1
                        ? isDark
                          ? 'border-b border-gray-700'
                          : 'border-b border-gray-100'
                        : ''
                        }`}
                      activeOpacity={item.isToggle ? 1 : 0.7}
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-9 h-9 rounded-xl items-center justify-center"
                          style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}
                        >
                          <item.icon size={18} color="#0066cc" />
                        </View>
                        <Text className={`text-base font-medium ml-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.label}
                        </Text>
                      </View>
                      {item.isToggle ? (
                        <Switch
                          value={item.value}
                          onValueChange={item.onToggle}
                          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                          thumbColor={item.value ? '#0066cc' : '#f4f4f5'}
                        />
                      ) : (
                        <ChevronRight size={20} color={isDark ? '#6b7280' : '#d1d5db'} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            ))}

            {/* Sign Out Button */}
            <Animated.View key={`signout-${animationKey}`} entering={FadeInDown.duration(400).delay(500).springify()}>
              <TouchableOpacity
                onPress={signOut}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 16,
                  borderRadius: 16,
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                  marginTop: 24,
                }}
                activeOpacity={0.7}
              >
                <LogOut size={20} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontWeight: '600', marginLeft: 8 }}>Sign Out</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
});

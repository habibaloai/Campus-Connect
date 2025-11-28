import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
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
  Wallet,
  Utensils,
  Navigation,
  Bot,
  Briefcase,
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
import { useColorScheme } from '@/components/useColorScheme';

export default function ProfileScreen() {
  const { user, profile, signOut, biometricAvailable, biometricEnabled, enableBiometric, disableBiometric, refreshProfile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Refresh profile when screen comes into focus (e.g., returning from edit)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log('[Profile Screen] Screen focused, refreshing profile...');
        refreshProfile();
      }
    }, [user?.id, refreshProfile])
  );

  const quickLinks = [
    { icon: BookOpen, label: 'Academics', route: '/academics', color: '#3b82f6', bgColor: '#dbeafe' },
    { icon: Wallet, label: 'Financial', route: '/financial', color: '#10b981', bgColor: '#d1fae5' },
    { icon: Utensils, label: 'Dining', route: '/dining', color: '#f59e0b', bgColor: '#fef3c7' },
    { icon: Navigation, label: 'Navigate', route: '/transport', color: '#6366f1', bgColor: '#e0e7ff' },
    { icon: Bot, label: 'AI Assistant', route: '/ai', color: '#8b5cf6', bgColor: '#ede9fe' },
    { icon: Briefcase, label: 'Career', route: '/career', color: '#64748b', bgColor: '#f1f5f9' },
    { icon: Heart, label: 'Wellness', route: '/wellness', color: '#ec4899', bgColor: '#fce7f3' },
    { icon: Trophy, label: 'Achievements', route: '/achievements', color: '#f59e0b', bgColor: '#fef3c7' },
  ];

  const gamificationLinks = [
    { icon: Flame, label: 'Streaks', route: '/streaks', color: '#f59e0b', bgColor: '#fef3c7' },
    { icon: TrendingUp, label: 'Leaderboards', route: '/leaderboards', color: '#3b82f6', bgColor: '#dbeafe' },
    { icon: Target, label: 'Challenges', route: '/challenges', color: '#10b981', bgColor: '#d1fae5' },
  ];

  const menuItems = [
    {
      title: 'Account',
      items: [
        { icon: Bell, label: 'Notifications', onPress: () => router.push('/notifications') },
        { icon: Settings, label: 'Preferences', onPress: () => {} },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: Shield, label: 'Change Password', onPress: () => {} },
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
        { icon: HelpCircle, label: 'Help & FAQ', onPress: () => {} },
        { icon: Mail, label: 'Contact Us', onPress: () => {} },
      ],
    },
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-[#f8fafc]'}`} edges={['bottom']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Animated.View
          entering={FadeInDown.duration(500).springify()}
          className={`py-5 px-5 mx-5 mt-3 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="flex-row items-start">
            {/* Profile Picture */}
            <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mr-4" style={{ overflow: 'hidden' }}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <User size={40} color="#3b82f6" />
              )}
            </View>

            {/* Name and Info */}
            <View className="flex-1">
              <Text className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {profile?.nickname || profile?.name || 'Student'}
              </Text>
              {profile?.nickname && profile.nickname !== profile.name && (
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {profile.name}
                </Text>
              )}
              {profile?.major && (
                <View className="flex-row items-center mb-2">
                  <GraduationCap size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text className={`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {profile.major} • {profile.year || 'Student'}
                  </Text>
                </View>
              )}

              {/* Follow, Friend Requests, Map */}
              <View className="flex-row items-start mt-4" style={{ gap: 20 }}>
                <TouchableOpacity
                  onPress={() => router.push('/connections')}
                  className="items-center"
                  activeOpacity={0.7}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center mb-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <UserCheck size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
                  </View>
                  <Text className={`text-xs text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Follow
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => router.push('/connections/requests')}
                  className="items-center"
                  activeOpacity={0.7}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center mb-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <UserPlus size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
                  </View>
                  <Text className={`text-xs text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Requests
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => router.push('/connections/map')}
                  className="items-center"
                  activeOpacity={0.7}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center mb-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <MapPin size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
                  </View>
                  <Text className={`text-xs text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Map
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Description, Hobbies, Favorite Lecture */}
          <View className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: isDark ? '#374151' : '#e5e7eb' }}>
            <Text className={`text-sm mb-3 leading-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {profile?.bio || 'Passionate student exploring the world of technology and innovation.'}
            </Text>
            
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {/* Favorite Lecture - First */}
              <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                <BookOpen size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`text-xs ml-1.5 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`} numberOfLines={1}>
                  {profile?.favorite_lecture || 'Introduction to Computer Science'}
                </Text>
              </View>

              {/* Interests - Second and Third */}
              {profile?.interests && profile.interests.length > 0 ? (
                profile.interests.slice(0, 2).map((interest, idx) => (
                  <View key={idx} className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                    <Hash size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text className={`text-xs ml-1.5 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {interest}
                    </Text>
                  </View>
                ))
              ) : (
                <>
                  <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                    <Hash size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text className={`text-xs ml-1.5 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Photography
                    </Text>
                  </View>
                  <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                    <Hash size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text className={`text-xs ml-1.5 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Reading
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            onPress={() => router.push('/profile/edit')}
            className={`flex-row items-center justify-center py-2.5 mt-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}
            activeOpacity={0.7}
            style={{
              borderWidth: 1,
              borderColor: isDark ? '#4b5563' : '#e5e7eb',
            }}
          >
            <User size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text className={`text-xs font-medium ml-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Gamification Section */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100).springify()}
          className="px-5 mt-5"
        >
          <View className="flex-row flex-wrap justify-between">
            {gamificationLinks.map((link, index) => (
              <TouchableOpacity
                key={link.label}
                onPress={() => router.push(link.route as any)}
                className={`w-[31%] items-center mb-4 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.06,
                  shadowRadius: 6,
                  elevation: 3,
                }}
                activeOpacity={0.8}
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mb-2.5"
                  style={{ backgroundColor: link.bgColor }}
                >
                  <link.icon size={22} color={link.color} />
                </View>
                <Text className={`text-xs font-semibold text-center ${isDark ? 'text-white' : 'text-gray-700'}`} numberOfLines={1}>
                  {link.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Quick Links */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(150).springify()}
          className="px-5 mt-2"
        >
          <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Quick Access
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {quickLinks.map((link, index) => (
              <TouchableOpacity
                key={link.label}
                onPress={() => router.push(link.route as any)}
                className={`w-[23%] items-center mb-4 p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.04,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                activeOpacity={0.8}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mb-2"
                  style={{ backgroundColor: link.bgColor }}
                >
                  <link.icon size={20} color={link.color} />
                </View>
                <Text className={`text-xs font-medium text-center ${isDark ? 'text-white' : 'text-gray-700'}`} numberOfLines={1}>
                  {link.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Menu Sections */}
        <View className="px-5 pt-2 pb-4">
          {menuItems.map((section, sectionIndex) => (
            <Animated.View
              key={section.title}
              entering={FadeInDown.duration(400).delay(200 + 80 * sectionIndex).springify()}
              className="mb-5"
            >
              <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {section.title}
              </Text>
              <View
                className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                {section.items.map((item: any, itemIndex) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={item.isToggle ? undefined : item.onPress}
                    className={`flex-row items-center justify-between px-4 py-3.5 ${
                      itemIndex !== section.items.length - 1
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
                        <item.icon size={18} color="#3b82f6" />
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
                        thumbColor={item.value ? '#3b82f6' : '#f4f4f5'}
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
          <Animated.View entering={FadeInDown.duration(400).delay(500).springify()}>
            <TouchableOpacity
              onPress={signOut}
              className={`flex-row items-center justify-center py-4 rounded-2xl ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}
              activeOpacity={0.7}
            >
              <LogOut size={20} color="#ef4444" />
              <Text className="text-red-500 font-semibold ml-2">Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* App Version */}
          <Text className={`text-center text-xs mt-6 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            Campus Connect v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

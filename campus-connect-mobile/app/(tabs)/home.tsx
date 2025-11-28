import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Bell,
  TrendingUp,
  BookOpen,
  Wallet,
  Award,
  Clock,
  ChevronRight,
  Flame,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuth, useNotifications } from '@/providers';
import { useColorScheme } from '@/components/useColorScheme';

// Mock data for today's classes
const todaysClasses = [
  {
    id: '1',
    code: 'CS301',
    name: 'Data Structures & Algorithms',
    location: 'Engineering 201',
    time: '10:00 AM',
    isNow: true,
  },
  {
    id: '2',
    code: 'CS350',
    name: 'Machine Learning Fundamentals',
    location: 'CS Building 302',
    time: '1:00 PM',
    isNow: false,
  },
  {
    id: '3',
    code: 'MATH201',
    name: 'Linear Algebra',
    location: 'Math Building 105',
    time: '3:30 PM',
    isNow: false,
  },
];

// Stats data
const statsData = [
  { id: 'gpa', label: 'GPA', value: '3.75', icon: TrendingUp, color: '#10b981', bgColor: '#d1fae5' },
  { id: 'credits', label: 'CREDITS', value: '78', icon: BookOpen, color: '#3b82f6', bgColor: '#dbeafe' },
  { id: 'balance', label: 'BALANCE', value: '$156', icon: Wallet, color: '#f59e0b', bgColor: '#fef3c7' },
  { id: 'points', label: 'POINTS', value: '2450', icon: Award, color: '#ef4444', bgColor: '#fee2e2' },
];

export default function HomeScreen() {
  const { user, profile, signOut } = useAuth();
  const { unreadCount, refreshNotifications } = useNotifications();
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(7);

  const isDark = colorScheme === 'dark';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshNotifications(),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);
    setRefreshing(false);
  }, [refreshNotifications]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = profile?.name || user?.email?.split('@')[0] || 'Student';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-[#f8fafc]'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(500).springify()}
          className={`px-5 pt-3 pb-2 flex-row items-center justify-between ${isDark ? 'bg-gray-900' : 'bg-[#f8fafc]'}`}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-transparent items-center justify-center mr-3 overflow-hidden">
              <Image 
                source={require('@/assets/images/tum-logo.png')}
                style={{ width: 40, height: 40, resizeMode: 'contain' }}
              />
            </View>
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Campus Connect
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Bell size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full items-center justify-center px-1">
                <Text className="text-white text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Greeting Section */}
        <Animated.View 
          entering={FadeInDown.duration(500).delay(100).springify()}
          className="px-5 pt-4 pb-2"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {greeting()}, {userName}! 👋
              </Text>
              <Text className={`text-base mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Here's what's happening today
              </Text>
            </View>
            
            {/* Streak Badge */}
            <View className="flex-row items-center bg-orange-100 px-3 py-2 rounded-full">
              <Flame size={16} color="#f97316" />
              <Text className="text-orange-600 font-semibold text-sm ml-1">
                {streak} day streak
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View 
          entering={FadeInDown.duration(500).delay(200).springify()}
          className="px-5 py-4"
        >
          <View className="flex-row justify-between">
            {statsData.map((stat, index) => (
              <Animated.View
                key={stat.id}
                entering={FadeInRight.duration(400).delay(250 + index * 80).springify()}
                className={`flex-1 ${index < 3 ? 'mr-3' : ''}`}
              >
                <View
                  className={`p-3 rounded-2xl items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mb-2"
                    style={{ backgroundColor: stat.bgColor }}
                  >
                    <stat.icon size={22} color={stat.color} />
                  </View>
                  <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </Text>
                  <Text className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {stat.label}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Notification Banner */}
        <Animated.View 
          entering={FadeInDown.duration(500).delay(350).springify()}
          className="px-5 py-2"
        >
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            className={`flex-row items-center p-4 rounded-2xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}
            activeOpacity={0.8}
          >
            <View className="w-11 h-11 rounded-xl bg-blue-100 items-center justify-center">
              <Bell size={22} color="#3b82f6" />
            </View>
            <View className="flex-1 ml-4">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                You have {unreadCount || 4} new notifications
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Tap to view all
              </Text>
            </View>
            <ChevronRight size={20} color={isDark ? '#9ca3af' : '#9ca3af'} />
          </TouchableOpacity>
        </Animated.View>

        {/* Today's Classes */}
        <Animated.View 
          entering={FadeInDown.duration(500).delay(450).springify()}
          className="px-5 pt-4"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <BookOpen size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`text-lg font-semibold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Today's Classes
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/academics')}>
              <Text className="text-blue-500 font-medium text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {todaysClasses.map((classItem, index) => (
            <Animated.View
              key={classItem.id}
              entering={FadeInDown.duration(400).delay(500 + index * 80).springify()}
            >
              <TouchableOpacity
                className={`p-4 rounded-2xl mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <View className="mr-4">
                    {classItem.isNow ? (
                      <View className="bg-blue-500 px-3 py-1.5 rounded-lg">
                        <View className="flex-row items-center">
                          <Clock size={14} color="#ffffff" />
                          <Text className="text-white font-semibold text-sm ml-1">
                            {classItem.time}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View className="flex-row items-center">
                        <Clock size={16} color={isDark ? '#9ca3af' : '#9ca3af'} />
                        <Text className={`font-medium ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {classItem.time}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View className="flex-1">
                    <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {classItem.code}
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {classItem.name}
                    </Text>
                    <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {classItem.location}
                    </Text>
                  </View>

                  {classItem.isNow && (
                    <View className="bg-blue-500 px-3 py-1.5 rounded-lg">
                      <Text className="text-white font-bold text-xs">NOW</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View 
          entering={FadeInDown.duration(500).delay(700).springify()}
          className="px-5 pt-4"
        >
          <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Quick Actions
          </Text>
          
          <View className="flex-row flex-wrap justify-between">
            {[
              { title: 'Community', route: '/(tabs)/community', color: '#00897b', bgColor: '#e0f2f1' },
              { title: 'Events', route: '/(tabs)/events', color: '#9c27b0', bgColor: '#f3e5f5' },
              { title: 'Messages', route: '/(tabs)/messages', color: '#3b82f6', bgColor: '#dbeafe' },
              { title: 'More', route: '/(tabs)/profile', color: '#6b7280', bgColor: '#f3f4f6' },
            ].map((action, index) => (
              <TouchableOpacity
                key={action.title}
                onPress={() => router.push(action.route as any)}
                className={`w-[48%] p-4 rounded-2xl mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                activeOpacity={0.8}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mb-2"
                  style={{ backgroundColor: action.bgColor }}
                >
                  <View className="w-5 h-5 rounded-full" style={{ backgroundColor: action.color }} />
                </View>
                <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Sign Out Button */}
        <View className="px-5 mt-6">
          <TouchableOpacity
            onPress={signOut}
            className={`py-3.5 rounded-xl items-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
          >
            <Text className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

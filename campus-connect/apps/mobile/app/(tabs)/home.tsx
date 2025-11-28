import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import BackgroundImage from '@/components/BackgroundImage';
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
    { id: 'credits', label: 'CREDITS', value: '78', icon: BookOpen, color: '#0066cc', bgColor: '#e6f2ff' },
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
    return 'Welcome back';
  };

  const userName = profile?.name || user?.email?.split('@')[0] || 'Student';

  return (
    <BackgroundImage overlayOpacity={isDark ? 0.7 : 0.4}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        
        <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066cc" />
        }
      >
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(500).springify()}
          style={styles.header}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 12, 
              backgroundColor: 'transparent', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginRight: 12,
              overflow: 'hidden'
            }}>
              <Image 
                source={require('@/assets/images/tum-logo.png')}
                style={{ width: 40, height: 40, resizeMode: 'contain' }}
              />
            </View>
            <Text style={[
              styles.headerTitle, 
              isDark && styles.headerTitleDark,
              !isDark && { 
                color: '#1e293b',
                textShadowColor: 'rgba(255, 255, 255, 0.8)',
              }
            ]}>
              Campus Connect
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={[
              styles.notificationButton,
              !isDark && { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
            ]}
          >
            <Bell size={20} color={isDark ? "#ffffff" : "#1e293b"} />
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
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 24, 
                fontWeight: 'bold', 
                color: isDark ? '#ffffff' : '#1e293b',
                textShadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}>
                {greeting()}, {userName}! 👋
              </Text>
              <Text style={{ 
                fontSize: 16, 
                marginTop: 4, 
                color: isDark ? 'rgba(255, 255, 255, 0.9)' : '#475569',
                textShadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.6)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>
                Here's what's happening today
              </Text>
            </View>
            
            {/* Streak Badge */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : '#ffedd5',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
            }}>
              <Flame size={16} color="#f97316" />
              <Text style={{
                color: isDark ? '#fbbf24' : '#ea580c',
                fontWeight: '600',
                fontSize: 14,
                marginLeft: 6,
              }}>
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
                  style={{
                    padding: 12,
                    borderRadius: 24,
                    alignItems: 'center',
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.3 : 0.15,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                >
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mb-2"
                    style={{ backgroundColor: stat.bgColor }}
                  >
                    <stat.icon size={22} color={stat.color} />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? '#ffffff' : '#1e293b' }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>
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
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: 24,
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
            activeOpacity={0.8}
          >
             <View className="w-11 h-11 rounded-xl bg-blue-100 items-center justify-center">
               <Bell size={22} color="#0066cc" />
             </View>
            <View className="flex-1 ml-4">
              <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#ffffff' : '#1e293b' }}>
                You have {unreadCount || 4} new notifications
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }}>
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
              <Text style={{ fontSize: 18, fontWeight: '600', marginLeft: 8, color: isDark ? '#ffffff' : '#1e293b' }}>
                Today's Classes
              </Text>
            </View>
             <TouchableOpacity onPress={() => router.push('/academics')}>
               <Text style={{ color: '#0066cc', fontWeight: '500', fontSize: 14 }}>View All</Text>
             </TouchableOpacity>
          </View>

          {todaysClasses.map((classItem, index) => (
            <Animated.View
              key={classItem.id}
              entering={FadeInDown.duration(400).delay(500 + index * 80).springify()}
            >
              <TouchableOpacity
                style={{
                  padding: 16,
                  borderRadius: 24,
                  marginBottom: 12,
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDark ? 0.3 : 0.15,
                  shadowRadius: 12,
                  elevation: 6,
                }}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <View className="mr-4">
                     {classItem.isNow ? (
                       <View style={{ backgroundColor: '#0066cc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                           <Clock size={14} color="#ffffff" />
                           <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14, marginLeft: 4 }}>
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
                     <View style={{ backgroundColor: '#0066cc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                       <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>NOW</Text>
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
               { title: 'Events', route: '/(tabs)/events', color: '#0066cc', bgColor: '#e6f2ff' },
               { title: 'Messages', route: '/(tabs)/messages', color: '#0066cc', bgColor: '#e6f2ff' },
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
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerTitleDark: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowRadius: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

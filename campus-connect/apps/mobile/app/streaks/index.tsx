import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronLeft,
  Flame,
  BookOpen,
  Calendar,
  Dumbbell,
  Utensils,
  Users,
  Clock,
  Award,
  Shield,
  TrendingUp,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api } from '@/lib/supabase';
import { Streak, UserStats } from '@/types';

const STREAK_TYPES = [
  { type: 'attendance', label: 'Attendance', icon: BookOpen, color: '#3B82F6', emoji: '📚' },
  { type: 'grade', label: 'Grade Streak', icon: Award, color: '#10B981', emoji: '⭐' },
  { type: 'submission', label: 'Submission', icon: TrendingUp, color: '#8B5CF6', emoji: '📝' },
  { type: 'study_hours', label: 'Study Hours', icon: Clock, color: '#F59E0B', emoji: '⏰' },
  { type: 'early_bird', label: 'Early Bird', icon: Clock, color: '#EC4899', emoji: '🌅' },
  { type: 'event_attendance', label: 'Events', icon: Calendar, color: '#EF4444', emoji: '🎉' },
  { type: 'workout', label: 'Workout', icon: Dumbbell, color: '#14B8A6', emoji: '💪' },
  { type: 'mensa', label: 'Mensa', icon: Utensils, color: '#F97316', emoji: '🍽️' },
  { type: 'friend_meetup', label: 'Friend Meetup', icon: Users, color: '#6366F1', emoji: '👥' },
];

export default function StreaksScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [streaksRes, statsRes] = await Promise.all([
        api.getStreaks(user.id),
        api.getUserStats(user.id),
      ]);

      if (streaksRes.data) {
        setStreaks(streaksRes.data);
      }
      if (statsRes.data) {
        setUserStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error loading streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStreakForType = (type: string) => {
    return streaks.find((s) => s.streak_type === type);
  };

  const getStreakEmoji = (days: number) => {
    if (days >= 100) return '🔥🔥🔥';
    if (days >= 30) return '🔥🔥';
    if (days >= 7) return '🔥';
    return '';
  };

  const handleRecovery = async (streakType: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Use Streak Recovery?',
      'This will restore your streak. You can only use this once per month.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Recovery',
          onPress: async () => {
            const { error } = await api.useStreakRecovery(user.id, streakType);
            if (error) {
              Alert.alert('Error', error.message || 'Failed to use recovery');
            } else {
              Alert.alert('Success', 'Your streak has been recovered!');
              await loadData();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View className={`flex-row items-center justify-between px-5 py-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ChevronLeft size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <Flame size={24} color="#F59E0B" />
            <Text className={`text-xl font-bold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Streaks
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Stats */}
        {userStats && (
          <Animated.View
            entering={FadeInDown.duration(500)}
            className={`mx-5 mt-4 rounded-2xl p-5 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Current Streak
                </Text>
                <View className="flex-row items-center mt-1">
                  <Flame size={28} color="#F59E0B" />
                  <Text className={`text-3xl font-bold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {userStats.current_streak}
                  </Text>
                  <Text className={`text-lg ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    days
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Longest Streak
                </Text>
                <Text className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {userStats.longest_streak}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Points
                </Text>
                <Text className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {userStats.total_points.toLocaleString()}
                </Text>
              </View>
              <View className="items-end">
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Level {userStats.level}
                </Text>
                <Text className={`text-lg font-semibold mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {userStats.level === 1 ? 'Freshman' :
                   userStats.level === 2 ? 'Sophomore' :
                   userStats.level === 3 ? 'Junior' :
                   userStats.level === 4 ? 'Senior' :
                   userStats.level === 5 ? 'Graduate' :
                   userStats.level === 6 ? 'Master' :
                   userStats.level === 7 ? 'Doctor' : 'Legend'}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Streak Recovery Info */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          className={`mx-5 mt-4 rounded-2xl p-4 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}
        >
          <View className="flex-row items-center mb-2">
            <Shield size={18} color="#3B82F6" />
            <Text className={`text-sm font-semibold ml-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
              Streak Recovery Available
            </Text>
          </View>
          <Text className={`text-xs ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
            You can use streak recovery once per month to keep your streak alive if you miss a day.
          </Text>
        </Animated.View>

        {/* Streak Types */}
        <View className="px-5 mt-6 mb-4">
          <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Your Streaks
          </Text>

          {STREAK_TYPES.map((streakType, index) => {
            const streak = getStreakForType(streakType.type);
            const days = streak?.current_streak || 0;
            const Icon = streakType.icon;
            const canRecover = days === 0 && streak;

            return (
              <Animated.View
                key={streakType.type}
                entering={FadeInDown.duration(400).delay(150 + index * 50)}
                className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: `${streakType.color}20` }}
                    >
                      <Icon size={24} color={streakType.color} />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {streakType.label}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Flame size={14} color={days >= 7 ? '#F59E0B' : (isDark ? '#6b7280' : '#9ca3af')} />
                        <Text className={`text-2xl font-bold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {days}
                        </Text>
                        <Text className={`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {days === 1 ? 'day' : 'days'}
                        </Text>
                        {getStreakEmoji(days) && (
                          <Text className="text-xl ml-2">{getStreakEmoji(days)}</Text>
                        )}
                      </View>
                      {streak?.longest_streak && streak.longest_streak > days && (
                        <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          Best: {streak.longest_streak} days
                        </Text>
                      )}
                    </View>
                  </View>
                  {canRecover && (
                    <TouchableOpacity
                      onPress={() => handleRecovery(streakType.type)}
                      className={`px-3 py-2 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
                    >
                      <Text className="text-white text-xs font-medium">Recover</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Milestone Indicators */}
                {days > 0 && (
                  <View className="flex-row items-center mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: isDark ? '#374151' : '#e5e7eb' }}>
                    {[
                      { days: 7, label: 'Week', color: '#10B981' },
                      { days: 30, label: 'Month', color: '#3B82F6' },
                      { days: 100, label: 'Century', color: '#F59E0B' },
                    ].map((milestone) => (
                      <View key={milestone.days} className="flex-1 items-center">
                        <View
                          className={`w-8 h-8 rounded-full items-center justify-center ${
                            days >= milestone.days
                              ? ''
                              : isDark
                              ? 'bg-gray-700'
                              : 'bg-gray-200'
                          }`}
                          style={
                            days >= milestone.days
                              ? { backgroundColor: `${milestone.color}20` }
                              : {}
                          }
                        >
                          <Text
                            className="text-xs font-bold"
                            style={{
                              color: days >= milestone.days ? milestone.color : isDark ? '#6b7280' : '#9ca3af',
                            }}
                          >
                            {milestone.days}
                          </Text>
                        </View>
                        <Text
                          className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          {milestone.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}


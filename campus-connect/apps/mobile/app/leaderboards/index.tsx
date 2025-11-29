import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronLeft,
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  Zap,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api } from '@/lib/supabase';
import { Leaderboard, LeaderboardEntry, Profile } from '@/types';

const LEADERBOARD_TYPES = [
  { type: 'weekly', label: 'Weekly', icon: Calendar, color: '#3B82F6' },
  { type: 'monthly', label: 'Monthly', icon: TrendingUp, color: '#10B981' },
  { type: 'semester', label: 'Semester', icon: Award, color: '#F59E0B' },
];

const CATEGORIES = [
  { id: 'study_hours', label: 'Study Hours', icon: BookOpen },
  { id: 'points', label: 'Points', icon: Trophy },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'social', label: 'Social', icon: Users },
];

export default function LeaderboardsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedType, setSelectedType] = useState('weekly');
  const [selectedCategory, setSelectedCategory] = useState('points');
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadLeaderboard();
    }
  }, [user?.id, selectedType, selectedCategory]);

  const loadLeaderboard = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await api.getLeaderboard(selectedType, selectedCategory);

      if (data) {
        setLeaderboard(data);
        // Find user's rank
        const userEntry = data.entries?.find((e: LeaderboardEntry) => e.user_id === user.id);
        setUserRank(userEntry?.rank || null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return isDark ? '#6b7280' : '#9ca3af';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return Trophy;
    if (rank === 2) return Medal;
    if (rank === 3) return Award;
    return null;
  };

  const entries = leaderboard?.entries || [];

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
          <Trophy size={24} color="#F59E0B" />
          <Text className={`text-xl font-bold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Leaderboard
          </Text>
        </View>
      </View>

      {/* Type Selector */}
      <View className={`px-5 py-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <View className={`flex-row rounded-xl p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          {LEADERBOARD_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <TouchableOpacity
                key={type.type}
                onPress={() => setSelectedType(type.type)}
                className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
                  selectedType === type.type ? (isDark ? 'bg-gray-600' : 'bg-white') : ''
                }`}
              >
                <Icon
                  size={16}
                  color={selectedType === type.type ? type.color : (isDark ? '#9ca3af' : '#6b7280')}
                />
                <Text
                  className={`ml-1.5 font-medium text-xs ${
                    selectedType === type.type
                      ? isDark
                        ? 'text-white'
                        : 'text-gray-900'
                      : isDark
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Category Selector */}
      <View className={`px-5 pb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row" style={{ gap: 8 }}>
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-xl flex-row items-center ${
                    selectedCategory === category.id
                      ? isDark
                        ? 'bg-blue-600'
                        : 'bg-blue-500'
                      : isDark
                      ? 'bg-gray-700'
                      : 'bg-gray-200'
                  }`}
                >
                  <Icon
                    size={16}
                    color={selectedCategory === category.id ? '#fff' : (isDark ? '#9ca3af' : '#6b7280')}
                  />
                  <Text
                    className={`ml-2 font-medium text-sm ${
                      selectedCategory === category.id
                        ? 'text-white'
                        : isDark
                        ? 'text-gray-300'
                        : 'text-gray-700'
                    }`}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading leaderboard...</Text>
          </View>
        ) : entries.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 px-5">
            <Trophy size={48} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text className={`text-lg font-semibold mt-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              No leaderboard data yet
            </Text>
            <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Start earning points to appear on the leaderboard!
            </Text>
          </View>
        ) : (
          <View className="px-5 py-4">
            {/* Top 3 Podium */}
            {entries.length >= 3 && (
              <View className="flex-row items-end justify-center mb-6" style={{ gap: 8 }}>
                {/* 2nd Place */}
                <Animated.View
                  entering={FadeInDown.duration(400).delay(100)}
                  className="flex-1 items-center"
                >
                  <View
                    className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                    style={{ borderWidth: 2, borderColor: '#C0C0C0' }}
                  >
                    {entries[1].user?.avatar_url ? (
                      <Image
                        source={{ uri: entries[1].user.avatar_url }}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <Medal size={24} color="#C0C0C0" />
                    )}
                  </View>
                  <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      #{entries[1].rank}
                    </Text>
                  </View>
                  <Text
                    className={`text-xs font-medium mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    numberOfLines={1}
                  >
                    {entries[1].user?.name || 'Unknown'}
                  </Text>
                  <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {entries[1].score.toLocaleString()}
                  </Text>
                </Animated.View>

                {/* 1st Place */}
                <Animated.View
                  entering={FadeInDown.duration(400).delay(50)}
                  className="flex-1 items-center"
                >
                  <View
                    className={`w-20 h-20 rounded-full items-center justify-center mb-2 ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                    style={{ borderWidth: 3, borderColor: '#FFD700' }}
                  >
                    {entries[0].user?.avatar_url ? (
                      <Image
                        source={{ uri: entries[0].user.avatar_url }}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <Trophy size={28} color="#FFD700" />
                    )}
                  </View>
                  <View className="px-3 py-1 rounded-full bg-yellow-500">
                    <Text className="text-xs font-bold text-white">#{entries[0].rank}</Text>
                  </View>
                  <Text
                    className={`text-xs font-medium mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
                    numberOfLines={1}
                  >
                    {entries[0].user?.name || 'Unknown'}
                  </Text>
                  <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {entries[0].score.toLocaleString()}
                  </Text>
                </Animated.View>

                {/* 3rd Place */}
                <Animated.View
                  entering={FadeInDown.duration(400).delay(150)}
                  className="flex-1 items-center"
                >
                  <View
                    className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                    style={{ borderWidth: 2, borderColor: '#CD7F32' }}
                  >
                    {entries[2].user?.avatar_url ? (
                      <Image
                        source={{ uri: entries[2].user.avatar_url }}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <Award size={24} color="#CD7F32" />
                    )}
                  </View>
                  <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      #{entries[2].rank}
                    </Text>
                  </View>
                  <Text
                    className={`text-xs font-medium mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    numberOfLines={1}
                  >
                    {entries[2].user?.name || 'Unknown'}
                  </Text>
                  <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {entries[2].score.toLocaleString()}
                  </Text>
                </Animated.View>
              </View>
            )}

            {/* Rest of Leaderboard */}
            {entries.slice(3).map((entry, index) => {
              const RankIcon = getRankIcon(entry.rank);
              const profile = entry.user as Profile;

              return (
                <Animated.View
                  key={entry.id}
                  entering={FadeInDown.duration(400).delay(200 + index * 50)}
                  className={`rounded-xl p-4 mb-3 ${
                    entry.user_id === user?.id
                      ? isDark
                        ? 'bg-blue-900/30 border-2 border-blue-600'
                        : 'bg-blue-50 border-2 border-blue-500'
                      : isDark
                      ? 'bg-gray-800'
                      : 'bg-white'
                  }`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isDark ? 0.3 : 0.04,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        entry.rank <= 3 ? '' : isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                      style={
                        entry.rank <= 3
                          ? { backgroundColor: `${getRankColor(entry.rank)}20` }
                          : {}
                      }
                    >
                      {RankIcon ? (
                        <RankIcon size={20} color={getRankColor(entry.rank)} />
                      ) : (
                        <Text
                          className="font-bold"
                          style={{ color: getRankColor(entry.rank) }}
                        >
                          {entry.rank}
                        </Text>
                      )}
                    </View>

                    <View className={`w-12 h-12 rounded-full mr-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} items-center justify-center`}>
                      {profile?.avatar_url ? (
                        <Image
                          source={{ uri: profile.avatar_url }}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <Users size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                      )}
                    </View>

                    <View className="flex-1">
                      <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {profile?.name || 'Unknown User'}
                        {entry.user_id === user?.id && ' (You)'}
                      </Text>
                      {profile?.major && (
                        <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {profile.major}
                        </Text>
                      )}
                    </View>

                    <View className="items-end">
                      <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {entry.score.toLocaleString()}
                      </Text>
                      <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {selectedCategory === 'study_hours' ? 'hours' : 'points'}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}

            {/* User's Position (if not in top 10) */}
            {userRank && userRank > 10 && (
              <Animated.View
                entering={FadeInDown.duration(400)}
                className={`rounded-xl p-4 mt-4 ${
                  isDark ? 'bg-blue-900/30 border-2 border-blue-600' : 'bg-blue-50 border-2 border-blue-500'
                }`}
              >
                <View className="flex-row items-center">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <Text className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {userRank}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      You
                    </Text>
                    <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Keep going!
                    </Text>
                  </View>
                  <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {leaderboard?.entries?.find((e) => e.user_id === user?.id)?.score.toLocaleString() || 0}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}


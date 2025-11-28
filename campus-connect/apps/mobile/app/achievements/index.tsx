import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import {
  ChevronLeft,
  Trophy,
  Star,
  Target,
  Flame,
  Award,
  Zap,
  Users,
  BookOpen,
  Calendar,
  MessageCircle,
  TrendingUp,
  Shield,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '@/providers';
import { useColorScheme } from '@/components/useColorScheme';
import { api } from '@/lib/supabase';
import { Achievement, UserAchievement, UserStats, LeaderboardEntry } from '@/types';

const categoryIcons: Record<string, any> = {
  academic: BookOpen,
  social: Users,
  wellness: Zap,
  special: Trophy,
  streak: Flame,
};

const rarityColors: Record<string, string> = {
  common: '#6B7280',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};

export default function AchievementsScreen() {
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'leaderboard'>('achievements');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [achievementsRes, userAchievementsRes, statsRes, leaderboardRes] = await Promise.all([
        api.getAchievements(),
        api.getUserAchievements(user.id),
        api.getUserStats(user.id),
        api.getLeaderboard('weekly', 'points'),
      ]);

      if (achievementsRes.data) {
        setAchievements(achievementsRes.data);
      }
      if (userAchievementsRes.data) {
        setUserAchievements(userAchievementsRes.data);
      }
      if (statsRes.data) {
        setUserStats(statsRes.data);
      }
      if (leaderboardRes.data?.entries) {
        setLeaderboard(leaderboardRes.data.entries);
        const userEntry = leaderboardRes.data.entries.find((e: LeaderboardEntry) => e.user_id === user.id);
        setUserRank(userEntry?.rank || null);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId && ua.is_completed);
  };

  const getUserProgress = (achievementId: string) => {
    const userAchievement = userAchievements.find((ua) => ua.achievement_id === achievementId);
    return userAchievement?.progress || 0;
  };

  const totalPoints = userStats?.total_points || 0;
  const unlockedCount = userAchievements.filter((ua) => ua.is_completed).length;

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#6B7280';
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Stack.Screen
        options={{
          title: 'Achievements',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ChevronLeft size={24} color={isDark ? '#fff' : '#374151'} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Card */}
        <Animated.View entering={FadeInDown.duration(500)} className="px-4 pt-4">
          <View className={`rounded-2xl p-5 ${isDark ? 'bg-gradient-to-r from-yellow-600 to-orange-600' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white/80 text-sm">Your Points</Text>
                <View className="flex-row items-center">
                  <Text className="text-white text-4xl font-bold">{totalPoints.toLocaleString()}</Text>
                  <Star size={24} color="#FFFFFF" className="ml-2" fill="#FFFFFF" />
                </View>
              </View>
              <View className="items-end">
                {userRank && (
                  <View className="bg-white/20 rounded-full px-4 py-2 mb-2">
                    <Text className="text-white font-semibold">Rank #{userRank}</Text>
                  </View>
                )}
                <Text className="text-white/80 text-sm">
                  {unlockedCount}/{achievements.length} unlocked
                </Text>
              </View>
            </View>

            {/* Progress to next level */}
            {userStats && (
              <View className="mt-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-white/80 text-sm">
                    Level {userStats.level} - {userStats.level === 1 ? 'Freshman' :
                    userStats.level === 2 ? 'Sophomore' :
                    userStats.level === 3 ? 'Junior' :
                    userStats.level === 4 ? 'Senior' :
                    userStats.level === 5 ? 'Graduate' :
                    userStats.level === 6 ? 'Master' :
                    userStats.level === 7 ? 'Doctor' : 'Legend'}
                  </Text>
                </View>
                <View className="h-3 bg-white/30 rounded-full overflow-hidden">
                  <View className="h-full bg-white rounded-full" style={{ width: '75%' }} />
                </View>
              </View>
            )}

            {/* Quick Links */}
            <View className="flex-row mt-4" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => router.push('/streaks')}
                className="flex-1 bg-white/20 rounded-xl py-2 items-center"
              >
                <Flame size={18} color="#FFFFFF" />
                <Text className="text-white text-xs font-medium mt-1">Streaks</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/leaderboards')}
                className="flex-1 bg-white/20 rounded-xl py-2 items-center"
              >
                <Trophy size={18} color="#FFFFFF" />
                <Text className="text-white text-xs font-medium mt-1">Leaderboards</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/challenges')}
                className="flex-1 bg-white/20 rounded-xl py-2 items-center"
              >
                <Target size={18} color="#FFFFFF" />
                <Text className="text-white text-xs font-medium mt-1">Challenges</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Tab Switcher */}
        <Animated.View entering={FadeInDown.duration(500).delay(50)} className="px-4 mt-6">
          <View className={`rounded-xl p-1 flex-row ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <TouchableOpacity
              onPress={() => setSelectedTab('achievements')}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                selectedTab === 'achievements' ? (isDark ? 'bg-gray-600' : 'bg-white') : ''
              }`}
            >
              <Trophy
                size={18}
                color={selectedTab === 'achievements' ? '#F59E0B' : (isDark ? '#9ca3af' : '#6B7280')}
              />
              <Text
                className={`ml-2 font-medium ${
                  selectedTab === 'achievements' ? (isDark ? 'text-yellow-400' : 'text-yellow-600') : (isDark ? 'text-gray-400' : 'text-gray-500')
                }`}
              >
                Achievements
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedTab('leaderboard')}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                selectedTab === 'leaderboard' ? (isDark ? 'bg-gray-600' : 'bg-white') : ''
              }`}
            >
              <Award size={18} color={selectedTab === 'leaderboard' ? '#3B82F6' : (isDark ? '#9ca3af' : '#6B7280')} />
              <Text
                className={`ml-2 font-medium ${
                  selectedTab === 'leaderboard' ? (isDark ? 'text-blue-400' : 'text-blue-500') : (isDark ? 'text-gray-400' : 'text-gray-500')
                }`}
              >
                Leaderboard
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {selectedTab === 'achievements' ? (
          /* Achievements List */
          <Animated.View entering={FadeIn.duration(300)} className="px-4 mt-6">
            {achievements.map((achievement, index) => {
              const CategoryIcon = categoryIcons[achievement.category || 'academic'] || Target;
              const unlocked = isUnlocked(achievement.id);
              const progress = getUserProgress(achievement.id);
              const maxProgress = achievement.requirement_value || 1;
              const progressPercentage = (progress / maxProgress) * 100;

              return (
                <Animated.View
                  key={achievement.id}
                  entering={FadeInDown.duration(400).delay(100 + index * 50)}
                >
                  <TouchableOpacity
                    className={`rounded-xl p-4 mb-3 ${
                      unlocked ? (isDark ? 'bg-gray-800 border border-yellow-500' : 'bg-white border border-yellow-200') : (isDark ? 'bg-gray-800' : 'bg-white')
                    } ${!unlocked ? 'opacity-80' : ''}`}
                    activeOpacity={0.7}
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.3 : 0.06,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <View className="flex-row items-start">
                      <View
                        className={`w-14 h-14 rounded-xl items-center justify-center mr-4 ${
                          unlocked ? (isDark ? 'bg-yellow-600/20' : 'bg-yellow-100') : (isDark ? 'bg-gray-700' : 'bg-gray-100')
                        }`}
                      >
                        {achievement.icon ? (
                          <Text className="text-2xl">{achievement.icon}</Text>
                        ) : (
                          <CategoryIcon size={24} color={unlocked ? '#F59E0B' : (isDark ? '#6b7280' : '#9ca3af')} />
                        )}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text
                            className={`text-base font-semibold ${
                              unlocked ? (isDark ? 'text-white' : 'text-gray-800') : (isDark ? 'text-gray-400' : 'text-gray-500')
                            }`}
                          >
                            {achievement.name}
                          </Text>
                          {unlocked && (
                            <View className={`px-2 py-1 rounded-full ${isDark ? 'bg-green-600/30' : 'bg-green-100'}`}>
                              <Text className={`text-xs font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                                Unlocked
                              </Text>
                            </View>
                          )}
                          {achievement.rarity && (
                            <View
                              className="px-2 py-1 rounded-full"
                              style={{ backgroundColor: `${rarityColors[achievement.rarity]}20` }}
                            >
                              <Text
                                className="text-xs font-medium capitalize"
                                style={{ color: rarityColors[achievement.rarity] }}
                              >
                                {achievement.rarity}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {achievement.description}
                        </Text>

                        {/* Progress bar */}
                        {!unlocked && maxProgress > 1 && (
                          <View className="mt-3">
                            <View className="flex-row justify-between mb-1">
                              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Progress
                              </Text>
                              <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {progress}/{maxProgress}
                              </Text>
                            </View>
                            <View className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <View
                                className="h-full bg-yellow-500 rounded-full"
                                style={{
                                  width: `${progressPercentage}%`,
                                }}
                              />
                            </View>
                          </View>
                        )}

                        <View className="flex-row items-center mt-2">
                          <Star size={14} color="#F59E0B" fill="#F59E0B" />
                          <Text className={`text-sm ml-1 font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                            {achievement.points} points
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>
        ) : (
          /* Leaderboard */
          <Animated.View entering={FadeIn.duration(300)} className="px-4 mt-6">
            {leaderboard.length === 0 ? (
              <View className={`rounded-xl p-8 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <Trophy size={48} color={isDark ? '#4b5563' : '#9ca3af'} />
                <Text className={`text-lg font-semibold mt-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  No leaderboard data yet
                </Text>
                <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Start earning points to appear on the leaderboard!
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/leaderboards')}
                  className={`mt-4 px-6 py-3 rounded-xl ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
                >
                  <Text className="text-white font-semibold">View Full Leaderboard</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  {leaderboard.slice(0, 5).map((entry, index) => {
                    const profile = entry.user as any;
                    return (
                      <TouchableOpacity
                        key={entry.id}
                        className={`flex-row items-center p-4 ${
                          index !== Math.min(leaderboard.length - 1, 4) ? (isDark ? 'border-b border-gray-700' : 'border-b border-gray-100') : ''
                        }`}
                      >
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center mr-3"
                          style={{
                            backgroundColor:
                              entry.rank <= 3 ? getRankColor(entry.rank) + '20' : (isDark ? '#374151' : '#F3F4F6'),
                          }}
                        >
                          <Text
                            className="font-bold"
                            style={{ color: getRankColor(entry.rank) }}
                          >
                            {entry.rank}
                          </Text>
                        </View>
                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          {profile?.avatar_url ? (
                            <Text className="text-xl">👤</Text>
                          ) : (
                            <Users size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {profile?.name || 'Unknown User'}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Star size={16} color="#F59E0B" fill="#F59E0B" />
                          <Text className={`text-base font-semibold ml-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {entry.score.toLocaleString()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Your Position */}
                {userRank && (
                  <View className={`mt-4 rounded-xl p-4 flex-row items-center ${
                    isDark ? 'bg-blue-900/30 border border-blue-600' : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-blue-600' : 'bg-blue-100'}`}>
                      <Text className={`font-bold ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>{userRank}</Text>
                    </View>
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-blue-700' : 'bg-blue-200'}`}>
                      <Text className="text-xl">🎯</Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`text-base font-medium ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                        You
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Star size={16} color="#3B82F6" fill="#3B82F6" />
                      <Text className={`text-base font-semibold ml-1 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                        {totalPoints.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => router.push('/leaderboards')}
                  className={`mt-4 rounded-xl py-3 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                >
                  <Text className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    View Full Leaderboard →
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}








